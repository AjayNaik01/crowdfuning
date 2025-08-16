const Razorpay = require('razorpay');
const crypto = require('crypto');
const axios = require('axios');

console.log('=== PAYMENT SERVICE LOADING ===');

// Initialize Razorpay instance
console.log('Razorpay config:', {
    key_id: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not set',
    key_secret: process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not set'
});

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

console.log('Razorpay instance created:', {
    hasContacts: !!razorpay.contacts,
    hasPayouts: !!razorpay.payouts,
    hasFundAccounts: !!razorpay.fundAccounts
});

console.log('=== PAYMENT SERVICE LOADED ===');

// Process refund for a payment
const refundPayment = async (paymentId, amount, reason = 'Refund') => {
    try {
        console.log(`Processing refund for payment ${paymentId}, amount: ${amount}, reason: ${reason}`);

        // For test mode, simulate successful refund
        if (process.env.RAZORPAY_KEY_ID?.includes('test')) {
            console.log('Test mode detected - simulating successful refund');

            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1000));

            return {
                success: true,
                refundId: `rfnd_test_${Date.now()}`,
                paymentId: paymentId,
                amount: amount,
                status: 'processed'
            };
        }

        // Production mode - actual Razorpay refund
        const refundOptions = {
            amount: Math.round(amount * 100), // Convert to paise
            speed: 'normal', // or 'optimum'
            notes: {
                reason: reason
            }
        };

        console.log('Creating refund with options:', refundOptions);

        const refund = await razorpay.payments.refund(paymentId, refundOptions);

        console.log('Refund created successfully:', refund.id);

        return {
            success: true,
            refundId: refund.id,
            paymentId: paymentId,
            amount: amount,
            status: refund.status
        };

    } catch (error) {
        console.error('Error processing refund:', error);

        // Handle specific Razorpay errors
        if (error.error?.description) {
            return {
                success: false,
                error: error.error.description
            };
        }

        return {
            success: false,
            error: error.message || 'Refund processing failed'
        };
    }
};

// Create a new order
const createOrder = async (amount, currency = 'INR', receipt = null) => {
    try {
        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`,
            payment_capture: 1 // Auto capture payment
        };

        const order = await razorpay.orders.create(options);
        return {
            success: true,
            order: order
        };
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Verify payment signature
const verifyPayment = (orderId, paymentId, signature) => {
    try {
        const text = `${orderId}|${paymentId}`;
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(text)
            .digest('hex');

        if (generated_signature === signature) {
            return {
                success: true,
                verified: true
            };
        } else {
            return {
                success: false,
                verified: false,
                error: 'Invalid signature'
            };
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        return {
            success: false,
            verified: false,
            error: error.message
        };
    }
};

// Get payment details
const getPaymentDetails = async (paymentId) => {
    try {
        const payment = await razorpay.payments.fetch(paymentId);
        return {
            success: true,
            payment: payment
        };
    } catch (error) {
        console.error('Error fetching payment details:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Create a payout to transfer money to beneficiary
const createPayout = async (amount, beneficiaryAccount, beneficiaryIfsc, beneficiaryName, purpose = 'Withdrawal payout', contactId = null) => {
    try {
        console.log('Creating payout with:', { amount, beneficiaryAccount, beneficiaryIfsc, beneficiaryName, purpose, contactId });

        // First create a fund account
        const fundAccountOptions = {
            account_type: 'bank_account',
            bank_account: {
                name: beneficiaryName,
                ifsc: beneficiaryIfsc,
                account_number: beneficiaryAccount
            }
        };

        // Add contact_id if provided
        if (contactId) {
            fundAccountOptions.contact_id = contactId;
        }

        console.log('Creating fund account with options:', fundAccountOptions);

        // Create fund account first
        const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

        let fundAccount;
        try {
            const fundAccountResponse = await axios.post('https://api.razorpay.com/v1/fund_accounts', fundAccountOptions, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            });
            fundAccount = fundAccountResponse.data;
            console.log('Fund account created:', fundAccount.id);
        } catch (fundError) {
            console.error('Fund account creation failed:', fundError.response?.data);
            throw new Error(`Fund account creation failed: ${fundError.response?.data?.error?.description || fundError.message}`);
        }

        // Now create payout using the fund account
        const payoutOptions = {
            fund_account_id: fundAccount.id,
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            mode: 'IMPS',
            purpose: purpose,
            queue_if_low_balance: true
        };

        console.log('Payout options:', payoutOptions);

        // For test mode, simulate successful payout creation
        if (process.env.RAZORPAY_KEY_ID?.includes('test')) {
            console.log('Test mode detected - simulating successful payout creation');

            // Create a mock payout response for testing
            payout = {
                id: `pout_test_${Date.now()}`,
                entity: 'payout',
                fund_account_id: fundAccount.id,
                amount: Math.round(amount * 100),
                currency: 'INR',
                mode: 'IMPS',
                purpose: purpose,
                status: 'processing',
                utr: null,
                user_id: 'user_test',
                account_number: beneficiaryAccount,
                notes: [],
                fees: 0,
                tax: 0,
                created_at: Math.floor(Date.now() / 1000)
            };

            console.log('Mock payout created successfully:', payout.id);
        } else {
            // Production mode - try actual Razorpay API
            console.log('Production mode - trying actual Razorpay payout API...');

            try {
                const response = await axios.post('https://api.razorpay.com/v1/payouts', payoutOptions, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json'
                    }
                });
                payout = response.data;
                console.log('Payout created successfully:', payout.id);
            } catch (error) {
                console.error('Payout creation failed:', error.response?.data);

                // Check if it's a balance or resource issue
                if (error.response?.data?.error?.description?.includes('insufficient') ||
                    error.response?.data?.error?.description?.includes('balance')) {
                    throw new Error('Insufficient balance in Razorpay account for payout');
                } else if (error.response?.data?.error?.description?.includes('not found')) {
                    throw new Error('Razorpay payout API endpoint not found - check API version');
                } else {
                    throw new Error(`Payout creation failed: ${error.response?.data?.error?.description || error.message}`);
                }
            }
        }

        return {
            success: true,
            payout: payout
        };
    } catch (error) {
        console.error('Error creating payout:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Get payout details
const getPayoutDetails = async (payoutId) => {
    try {
        const payout = await razorpay.payouts.fetch(payoutId);
        return {
            success: true,
            payout: payout
        };
    } catch (error) {
        console.error('Error fetching payout details:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Create fund account for beneficiary
const createFundAccount = async (beneficiaryAccount, beneficiaryIfsc, beneficiaryName, contactId) => {
    try {
        console.log('Creating fund account with:', { beneficiaryAccount, beneficiaryIfsc, beneficiaryName, contactId });

        const fundAccountOptions = {
            contact_id: contactId,
            account_type: 'bank_account',
            bank_account: {
                name: beneficiaryName,
                ifsc: beneficiaryIfsc,
                account_number: beneficiaryAccount
            }
        };

        console.log('Fund account options:', fundAccountOptions);

        // Try alternative API call if fundAccounts.create doesn't work
        let fundAccount;
        if (razorpay.fundAccounts && razorpay.fundAccounts.create) {
            fundAccount = await razorpay.fundAccounts.create(fundAccountOptions);
        } else {
            // Fallback: create fund account using direct API call
            console.log('Using fallback API call for fund account creation');
            const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

            try {
                const response = await axios.post('https://api.razorpay.com/v1/fund_accounts', fundAccountOptions, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json'
                    }
                });
                fundAccount = response.data;
            } catch (error) {
                console.error('Razorpay API Error Details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message
                });
                throw error;
            }
        }

        return {
            success: true,
            fundAccount: fundAccount
        };
    } catch (error) {
        console.error('Error creating fund account:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Check account balance (for testing purposes)
const checkAccountBalance = async () => {
    try {
        console.log('Checking Razorpay account balance...');
        const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

        const response = await axios.get('https://api.razorpay.com/v1/accounts/me', {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Account details:', response.data);
        return {
            success: true,
            balance: response.data.balance || 0,
            accountId: response.data.id
        };
    } catch (error) {
        console.error('Failed to check account balance:', error.response?.data);
        return {
            success: false,
            error: error.message
        };
    }
};

// Create contact for beneficiary
const createContact = async (name, email, contact) => {
    try {
        console.log('Creating contact with:', { name, email, contact });
        console.log('Razorpay instance:', razorpay);
        console.log('Razorpay contacts available:', !!razorpay.contacts);

        const contactOptions = {
            name: name,
            email: email,
            contact: contact,
            type: 'employee'
        };

        console.log('Contact options:', contactOptions);

        // Try alternative API call if contacts.create doesn't work
        let newContact;
        if (razorpay.contacts && razorpay.contacts.create) {
            newContact = await razorpay.contacts.create(contactOptions);
        } else {
            // Fallback: create contact using direct API call
            console.log('Using fallback API call for contact creation');
            const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

            const response = await axios.post('https://api.razorpay.com/v1/contacts', contactOptions, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            });
            newContact = response.data;
            console.log('Contact created successfully:', newContact);
        }

        return {
            success: true,
            contact: newContact
        };
    } catch (error) {
        console.error('Error creating contact:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    getPaymentDetails,
    createPayout,
    getPayoutDetails,
    createFundAccount,
    createContact,
    checkAccountBalance,
    refundPayment
}; 
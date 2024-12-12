// stripeService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createPaymentIntent(amount) {
  try {
    // Convert amount to smallest currency unit (paisa)
    const amountInPaisa = Math.round(amount * 100);
    
    // Minimum amount in PKR should be around 150 to meet Stripe's minimum requirement
    const minimumAmountInPaisa = 15000; // 150 PKR in paisa
    
    if (amountInPaisa < minimumAmountInPaisa) {
      throw new Error(`Amount must be at least 150 PKR`);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaisa,
      currency: 'pkr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        integration_check: 'accept_a_payment',
      }
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

async function confirmPaymentIntent(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    throw error;
  }
}

module.exports = {
  createPaymentIntent,
  confirmPaymentIntent,
};
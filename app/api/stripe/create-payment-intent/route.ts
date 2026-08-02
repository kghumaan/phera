import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'usd', fundType, donorName, message, productId } = await request.json();

    // Validate required fields
    if (!amount || amount < 50) { // Minimum $0.50
      return NextResponse.json(
        { error: 'Amount must be at least $0.50' },
        { status: 400 }
      );
    }

    if (!donorName) {
      return NextResponse.json(
        { error: 'Donor name is required' },
        { status: 400 }
      );
    }

    // Create payment intent
    const paymentIntentData: any = {
      amount: Math.round(amount), // Amount in cents
      currency,
      metadata: {
        fundType,
        donorName,
        message: message || '',
        productId: productId || '',
      },
      description: `${fundType === 'honeymoon-fund' ? 'Honeymoon Fund' : 'New Home Fund'} contribution from ${donorName}`,
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // If productId is provided, you can link it to the payment intent
    if (productId) {
      paymentIntentData.metadata.productId = productId;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
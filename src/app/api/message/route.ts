import { NextRequest, NextResponse } from 'next/server'

const RESTATE_INGRESS_URL = process.env.RESTATE_INGRESS_URL || 'http://localhost:8080'
const RESTATE_AUTH_TOKEN = process.env.RESTATE_AUTH_TOKEN || ''

export async function POST(request: NextRequest) {
  try {
    const { message, agentId } = (await request.json()) as {
      message: string;
      agentId: string;
    };

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }
    
    const res = await submitNewMessage(agentId, message);

    return NextResponse.json(res);

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function submitNewMessage(agentId: string, currentInput: string) {
  const response = await fetch(
    `${RESTATE_INGRESS_URL}/agent/${agentId}/newMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESTATE_AUTH_TOKEN}`,
      },
      body: JSON.stringify(currentInput),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to submit prompt");
  }

  return (await response.json()) as {
    currentTaskId: string;
  };
}
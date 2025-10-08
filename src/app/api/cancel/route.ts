import { NextRequest, NextResponse } from 'next/server'

const RESTATE_INGRESS_URL = process.env.RESTATE_INGRESS_URL || 'http://localhost:8080'
const RESTATE_AUTH_TOKEN = process.env.RESTATE_AUTH_TOKEN || ''

export async function POST(request: NextRequest) {
  try {
    const { agentId } = (await request.json()) as {
      agentId: string;
    };

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }
    
    const res = await submitCancel(agentId);

    return NextResponse.json(res);

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function submitCancel(agentId: string) {

  const response = await fetch(
    `${RESTATE_INGRESS_URL}/agent/${agentId}/cancelTask`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESTATE_AUTH_TOKEN}`,
      },
      body: JSON.stringify({}),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to submit prompt");
  }

  return (await response.json()) as {
    currentTaskId: string;
  };
}
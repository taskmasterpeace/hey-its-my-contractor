import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server: ASSEMBLYAI_API_KEY not set' },
        { status: 500 }
      )
    }
    const expires_in_seconds = 600
    // Token expires in 10 minutes (600 seconds)
    const response = await fetch(`https://streaming.assemblyai.com/v3/token?expires_in_seconds=${expires_in_seconds}`, {
      method: 'GET',
      headers: {
        Authorization: apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('AssemblyAI token error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to generate token' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ token: data.token })
  } catch (error) {
    console.error('Error generating token:', error)
    return NextResponse.json(
      { error: 'Token service unavailable' },
      { status: 500 }
    )
  }
}

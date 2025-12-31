# Voice AI Provider Exploration

This document explores voice AI providers for the AI Receptionist module. The goal is to find a cost-effective solution for healthcare industry clients that handles incoming calls, appointment booking, and FAQ responses.

## Requirements

- **Inbound call handling** (primary use case)
- **Appointment booking** via phone
- **FAQ responses** with natural conversation
- **Call transcription** for logging
- **Affordable pricing** for small healthcare practices
- **HIPAA compliance** (healthcare industry requirement)

---

## Provider Comparison

### 1. ElevenLabs Conversational AI (Current)

**Website**: elevenlabs.io

**Pros**:

- Best-in-class voice quality
- Easy to set up initial agent
- Good documentation

**Cons**:

- **Expensive** - voice synthesis costs add up quickly
- Requires separate telephony integration (Twilio)
- Not purpose-built for phone calls

**Pricing**: $0.30+/min for voice generation (varies by plan)

**Verdict**: Great voice quality but cost prohibitive for sustained call volume.

---

### 2. Vapi.ai

**Website**: vapi.ai

**Pros**:

- Purpose-built for voice AI agents
- Includes telephony (no separate Twilio needed)
- Supports multiple LLM backends (GPT-4, Claude, etc.)
- Supports multiple voice providers (ElevenLabs, PlayHT, etc.)
- Good developer experience
- Built-in call recording and transcription

**Cons**:

- Newer platform, less mature
- Per-minute pricing can still add up

**Pricing**: ~$0.05-0.15/min depending on voice + LLM choice

**Verdict**: Strong choice - balances features, flexibility, and cost.

---

### 3. Retell AI

**Website**: retellai.com

**Pros**:

- Competitive with Vapi
- Built-in telephony
- Good latency optimization
- Supports custom voices

**Cons**:

- Less flexible than Vapi for LLM choice
- Smaller community

**Pricing**: ~$0.10-0.20/min

**Verdict**: Good alternative to Vapi, worth testing.

---

### 4. Bland AI

**Website**: bland.ai

**Pros**:

- Very competitive pricing
- Simple API
- Good for high volume

**Cons**:

- Less customization
- Voice quality not as good as ElevenLabs

**Pricing**: ~$0.09/min (one of the cheapest)

**Verdict**: Best for cost-conscious deployments where voice quality is secondary.

---

### 5. Twilio + OpenAI (DIY)

**Website**: twilio.com + openai.com

**Pros**:

- Full control
- Can optimize costs
- Existing Twilio ecosystem

**Cons**:

- Significant development effort
- Need to handle latency, interruptions, turn-taking
- Voice synthesis still requires ElevenLabs/PlayHT

**Pricing**: Twilio ~$0.0085/min + OpenAI API + Voice synthesis

**Verdict**: Only if you need maximum control and have dev resources.

---

### 6. Play.AI (formerly PlayHT)

**Website**: play.ai

**Pros**:

- Good voice cloning
- Competitive pricing
- API for voice generation

**Cons**:

- Not a full phone agent platform
- Need to integrate with telephony

**Pricing**: Varies by plan

**Verdict**: Voice provider, not a complete solution.

---

## HIPAA Compliance Notes

For healthcare clients, HIPAA compliance is critical. Check:

- [ ] BAA (Business Associate Agreement) availability
- [ ] Data encryption at rest and in transit
- [ ] Call recording storage compliance
- [ ] PHI handling policies

**Known HIPAA-ready providers**:

- Vapi.ai offers BAA
- Retell AI offers BAA
- Bland AI - check current status
- ElevenLabs - enterprise tier may offer BAA

---

## Recommended Path

### Short-term (MVP):

1. **Start with Vapi.ai** - best balance of features, cost, and developer experience
2. Use their built-in telephony to avoid Twilio complexity
3. Choose a cost-effective voice (PlayHT or Deepgram) instead of ElevenLabs

### Long-term:

1. Monitor call volume and costs
2. Consider Bland AI if volume increases significantly
3. Evaluate custom solution only if hitting scale limits

---

## Integration Plan for SM Pro

### Minimal AI Receptionist Module:

**Database**:

```typescript
// lib/db/schema/ai-receptionist.ts
aiReceptionistSettings = pgTable('ai_receptionist_settings', {
  id: varchar('id'),
  clientId: varchar('client_id').references(clients.id),
  agentName: varchar('agent_name'),
  phoneNumber: varchar('phone_number'),
  voiceProvider: varchar('voice_provider'), // 'vapi' | 'retell' | 'bland'
  agentConfig: jsonb('agent_config'), // Provider-specific config
  isActive: boolean('is_active').default(false),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

callLogs = pgTable('call_logs', {
  id: varchar('id'),
  clientId: varchar('client_id'),
  callId: varchar('call_id'), // From provider
  callerNumber: varchar('caller_number'),
  duration: integer('duration'), // seconds
  transcript: text('transcript'),
  summary: text('summary'),
  outcome: varchar('outcome'), // 'appointment_booked' | 'info_provided' | 'transferred' | 'voicemail'
  recordingUrl: text('recording_url'),
  createdAt: timestamp('created_at'),
});
```

**UI Components**:

```
components/ai-receptionist/
  ├── agent-config-form.tsx      # Agent name, voice, instructions
  ├── phone-number-display.tsx   # Show assigned number
  ├── call-logs-table.tsx        # List of calls
  ├── call-detail-modal.tsx      # Transcript + recording playback
  └── ai-receptionist-tab.tsx    # Main tab component
```

**API Integration**:

- Webhook endpoint to receive call events from provider
- API routes to fetch call logs and update agent config

---

## Next Steps

1. [ ] Sign up for Vapi.ai free tier
2. [ ] Create test agent with healthcare greeting
3. [ ] Test inbound call flow
4. [ ] Evaluate voice quality and latency
5. [ ] Get pricing estimate for expected volume
6. [ ] Check HIPAA/BAA availability
7. [ ] Build minimal integration in SM Pro

---

## Resources

- Vapi.ai Docs: https://docs.vapi.ai
- Retell AI Docs: https://docs.retellai.com
- Bland AI Docs: https://docs.bland.ai
- ElevenLabs API: https://docs.elevenlabs.io

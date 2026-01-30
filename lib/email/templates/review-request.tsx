import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Hr,
} from '@react-email/components'

export interface ReviewRequestEmailProps {
  customerName: string
  businessName: string
  reviewLink: string
  senderName: string
}

export function ReviewRequestEmail({
  customerName,
  businessName,
  reviewLink,
  senderName,
}: ReviewRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Share your experience with {businessName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Hi {customerName},</Heading>

          <Text style={text}>
            Thank you for choosing {businessName}! We&apos;d really appreciate it if
            you could take a moment to share your experience.
          </Text>

          {reviewLink ? (
            <Button href={reviewLink} style={button}>
              Leave a Review
            </Button>
          ) : (
            <Text style={text}>
              We&apos;d love to hear your thoughts! Please share your experience with us.
            </Text>
          )}

          <Hr style={divider} />

          <Text style={footer}>
            Thanks so much,
            <br />
            {senderName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Email-safe styles (inline CSS required for email clients)
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '4px',
  maxWidth: '580px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600' as const,
  lineHeight: '1.3',
  margin: '0 0 20px',
}

const text = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '0 auto',
}

const divider = {
  borderColor: '#e6e6e6',
  margin: '32px 0',
}

const footer = {
  color: '#6a6a6a',
  fontSize: '14px',
  lineHeight: '1.5',
}

export default ReviewRequestEmail

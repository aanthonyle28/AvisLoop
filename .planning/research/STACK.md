# Stack Research: ReviewLoop

**Researched:** 2026-01-25

## Recommended Stack

### Core Framework
| Technology | Version | Confidence | Rationale |
|------------|---------|------------|-----------|
| **Next.js** | 16.x | High | Latest stable with Turbopack (default), React Compiler support, App Router mature. Server-first architecture ideal for SaaS. |
| **React** | 19.x | High | Ships with Next.js 16, concurrent features stable |
| **TypeScript** | 5.x | High | Type safety essential for SaaS, excellent DX |

### Backend Services
| Technology | Version | Confidence | Rationale |
|------------|---------|------------|-----------|
| **Supabase** | Latest | High | Production-ready BaaS with Postgres, Auth, RLS, real-time. Handles 10k+ concurrent connections. |
| **Resend** | Latest | High | Developer-friendly transactional email. Free tier: 3k emails/mo. Pro: $20/50k emails. React Email integration. |
| **Stripe** | API 2025-12-15 | High | Industry standard for SaaS billing. Monthly releases, no breaking changes between minor versions. |

### UI Layer
| Technology | Version | Confidence | Rationale |
|------------|---------|------------|-----------|
| **shadcn/ui** | Latest | High | Copy-paste components, full code ownership. Built on Radix UI + Tailwind. Used by OpenAI, Adobe. |
| **Tailwind CSS** | 4.x | High | Utility-first, pairs with shadcn/ui |
| **React Hook Form** | Latest | High | Performant form handling |
| **Zod** | Latest | High | Schema validation, works with React Hook Form |

### Infrastructure
| Technology | Confidence | Rationale |
|------------|------------|-----------|
| **Vercel** | High | Native Next.js deployment, edge functions, excellent DX |
| **Supabase Cloud** | High | Managed Postgres, automatic backups, connection pooling |

## What NOT to Use

| Technology | Reason |
|------------|--------|
| **Create React App** | Deprecated, no SSR support |
| **Express.js backend** | Unnecessary with Next.js API routes + Supabase |
| **Firebase** | Supabase provides better Postgres + RLS for this use case |
| **Chakra UI** | shadcn/ui offers more control and modern patterns |
| **Prisma** | Supabase client is sufficient, adds complexity |

## Key Considerations

### Supabase Production Best Practices
- Enable RLS on all user-facing tables
- Use connection pooling (Supavisor)
- Never expose service_role keys on frontend
- Use migrations for schema changes (not Dashboard)
- CI/CD for deployments with GitHub Actions

### Next.js 16 Architecture
- Server Components by default (no client JS shipped)
- "use client" directive for interactive components
- Keep client components leaf-level to maximize RSC benefits
- Server Actions for form submissions and mutations

### Email Deliverability
- Set up SPF, DKIM, DMARC authentication
- Warm up sending domain gradually
- Maintain consistent sending volumes
- Monitor bounce rates and complaints

## Sources
- [Next.js 16 Blog](https://nextjs.org/blog/next-16)
- [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Resend Documentation](https://resend.com/docs)
- [shadcn/ui Installation](https://ui.shadcn.com/docs/installation/next)

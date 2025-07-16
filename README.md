# SprintiQ.ai - AI-Powered Project Management & Story Generation Tool

Welcome to the SprintiQ.ai project! This is a comprehensive, AI-driven platform designed to streamline agile workflow management, story creation, prioritization, dependency tracking, and platform integrations for product teams and project managers.

---

## Features

- **Project Setup & Management**
  - Create and configure projects with basic settings
  - Manage user personas relevant to your product
- **AI-Powered User Story Generation**
  - Generate detailed user stories using AI (Claude API)
  - Edit, refine, and add custom acceptance criteria
- **Backlog Prioritization & Analytics**
  - Automatic weighted scoring of stories based on business value, impact, complexity, risk, and dependencies
  - Manual priority adjustments
  - Visual dashboard for priority distribution
- **Story Dependencies & Estimation**
  - Define and visualize story dependencies
  - Automatic story point estimation via AI
- **Platform Integrations**
  - Connect with Jira, GitHub, and other PM tools
  - Sync stories and manage API credentials securely
- **Sprint Planning & Management**
  - Create, manage, and assign stories to sprints
  - AI-driven sprint generation considering capacity, dependencies, and risks
  - Risk assessment for sprints with mitigation strategies
- **Analytics & Reporting**
  - Story point estimates and business value analysis
  - Project-wide risk monitoring
- **Data Export & Backup**
  - Export data in JSON/CSV formats
  - Backup and restore project data

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- pnpm
- Supabase account
- Claude API key (for AI features)

### Environment Variables

Copy the `.env.example` file to `.env.local` and fill in the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Claude Configuration (required for AI features)
CLAUDE_API_KEY=your_claude_api_key
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/cool1209/sprint-iq.git
cd sprint-iq
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up your Supabase database using the provided schema files.

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Usage

- Access the app at `http://localhost:3000`
- Create projects, define personas, generate stories, plan sprints, and connect to your PM tools

---

## Architecture Overview

- **Frontend:** Next.js + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes + TypeScript
- **Database:** PostgreSQL (via Supabase)
- **AI Integration:** Anthropic Claude API
- **Hosting:** Vercel
- **Authentication:** Supabase Auth

---

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your improvements.

- Follow the existing code style
- Write clear commit messages
- Ensure tests pass before submitting

---

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

## Contact

For questions or support, please open an issue or contact [your email].

---

## Acknowledgements

- Inspired by agile methodologies and AI advancements
- Special thanks to the open-source community

---

## Notes

This is an MVP project roadmap and ongoing development plan. Features will evolve based on user feedback and testing.

---

Happy coding! 🚀

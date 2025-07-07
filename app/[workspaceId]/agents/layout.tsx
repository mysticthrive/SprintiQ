import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Agents - SprintIQ",
  description:
    "AI-powered tools to help you manage your projects more efficiently.",
};

interface AgentsLayoutProps {
  children: React.ReactNode;
}

export default function AgentsLayout({ children }: AgentsLayoutProps) {
  return <div className="flex-1 ">{children}</div>;
}

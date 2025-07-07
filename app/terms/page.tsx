"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Shield,
  Users,
  Lock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Calendar,
  Mail,
  BookOpen,
  Scale,
  ChartGantt,
  Share2,
  ShieldCheck,
  BrainCircuit,
  CircleFadingArrowUp,
  ShieldAlert,
  Handshake,
  UsersRound,
  CircleAlert,
  Menu,
} from "lucide-react";
import Navbar from "@/components/landing/layout/navbar";
import Footer from "@/components/landing/layout/footer";
import ScrollToTop from "@/components/ui/scroll-to-top";
import { ScrollArea } from "@/components/ui/scroll-area";

const termsSections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    icon: <CheckCircle className="h-5 w-5" />,
    content: `
      <p>Welcome to SprintiQ, an AI-powered sprint planning and story generation platform operated by [COMPANY NAME] ("Company," "we," "us," or "our"). These Terms of Service ("Terms") govern your use of our website, mobile application, and related services (collectively, the "Service").</p>
      <p>By accessing or using SprintiQ, you ("User," "you," or "your") agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Service.</p>
      <br/><p><strong>These Terms contain important information about your legal rights, remedies, and obligations, including mandatory arbitration and class action waiver provisions in Section 15.</strong></p>
    `,
  },
  {
    id: "description",
    title: "2. Description of Service",
    icon: <BookOpen className="h-5 w-5" />,
    content: `
      <h3>2.1 Platform Overview</h3>
      <p>SprintiQ is a Software-as-a-Service (SaaS) platform that provides:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>AI-powered user story generation using Claude AI technology</li>
        <li>Intelligent backlog prioritization and management</li>
        <li>Sprint planning and capacity management tools</li>
        <li>Story dependency visualization and management</li>
        <li>Integration with third-party project management platforms</li>
        <li>Analytics and reporting capabilities</li>
      </ul>
      
      <h3>2.2 AI-Powered Features</h3>
      <p>Our Service utilizes artificial intelligence to:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Generate user stories based on project requirements</li>
        <li>Suggest story prioritization based on configurable criteria</li>
        <li>Estimate story points and complexity</li>
        <li>Identify potential risks and mitigation strategies</li>
        <li>Recommend sprint compositions and capacity allocation</li>
      </ul>
      
      <h3>2.3 Service Availability</h3>
      <p>We strive to maintain 99.9% uptime, but do not guarantee uninterrupted service availability. We may temporarily suspend the Service for maintenance, updates, or other operational reasons, providing reasonable notice when possible.</p>
    `,
  },
  {
    id: "eligibility",
    title: "3. Eligibility and Account Registration",
    icon: <Users className="h-5 w-5" />,
    content: `
      <h3>3.1 Eligibility Requirements</h3>
      <p>To use SprintiQ, you must:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Be at least 18 years old or have reached the age of majority in your jurisdiction</li>
        <li>Have the legal capacity to enter into binding agreements</li>
        <li>Not be prohibited from using the Service under applicable laws</li>
        <li>Provide accurate and complete registration information</li>
      </ul>
      
      <h3>3.2 Account Registration</h3>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>You must create an account to access most features of the Service</li>
        <li>You are responsible for maintaining the confidentiality of your account credentials</li>
        <li>You agree to notify us immediately of any unauthorized use of your account</li>
        <li>You may not share your account or allow others to access the Service through your account</li>
        <li>You are responsible for all activities that occur under your account</li>
      </ul>
      
      <h3>3.3 Business and Team Accounts</h3>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Team administrators are responsible for managing user access and permissions</li>
        <li>Business accounts may have additional terms and requirements</li>
        <li>Account administrators must ensure all team members comply with these Terms</li>
      </ul>
    `,
  },
  {
    id: "beta-subscription",
    title: "4. Beta Program and Subscription Plans",
    icon: <ChartGantt className="h-5 w-5" />,
    content: `
      <h3>4.1 Beta Program Terms</h3>
      <p><strong>Beta Program Participation:</strong> SprintiQ is currently in Beta testing phase. By participating in the Beta program, you acknowledge and agree that:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>The Service is provided on an "as-is" basis for testing and evaluation purposes</li>
        <li>Beta features may be incomplete, contain bugs, or function differently than described</li>
        <li>Your feedback and usage data will help us improve the platform for general availability</li>
        <li>Beta access may be limited and subject to availability</li>
        <li>We may reset, modify, or discontinue Beta features at any time with notice</li>
        <li>Beta participants receive early access to new features and priority support</li>
      </ul>
      
      <br/><p><strong>Beta Service Limitations:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Unlimited stories and projects during Beta period</li>
        <li>Team size limited to 5 members</li>
        <li>Full bi-directional integration with Jira and Azure DevOps (import and export)</li>
        <li>Additional integrations limited to basic export only</li>
        <li>Enhanced Beta support with priority response times</li>
        <li>Data export capabilities are available at all times</li>
      </ul>
      
      <h3>4.2 Beta Pricing and Future Plans</h3>
      <p><strong>Beta Pricing:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Free Beta Access: $0/month during Beta period (typically 6 months)</li>
        <li>Beta Features: Unlimited stories and projects, up to 5 team members</li>
        <li>Beta Perks: 30% lifetime discount on future paid plans for Beta participants</li>
        <li>Early Access: Priority access to new features and integrations</li>
      </ul>
      
      <br/><p><strong>Post-Beta Service Tiers (planned launch pricing):</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Free Tier: $0 - 30 stories/month, basic features</li>
        <li>Starter Tier: $19/user/month - 300 stories/month, integrations</li>
        <li>Professional Tier: $49/user/month - Unlimited stories, advanced AI</li>
        <li>Enterprise Tier: $99/user/month - Custom features, SSO, dedicated support</li>
      </ul>
      
      <h3>4.3 Transition from Beta to General Availability</h3>
      <p><strong>Beta to Production Migration:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>All Beta user data will be preserved during transition to general availability</li>
        <li>Beta users will receive 15 days advance notice before transition</li>
        <li>Beta participants qualify for lifetime 30% discount on Starter and Professional tiers</li>
        <li>No credit card required during Beta period</li>
        <li>Optional upgrade to paid plans available during Beta for additional features</li>
      </ul>
      
      <br/><p><strong>Post-Beta Billing:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Billing begins only after general availability launch</li>
        <li>Beta users can continue with Free tier or upgrade to paid plans</li>
        <li>Annual subscriptions receive additional 15% discount</li>
        <li>All fees are non-refundable except as required by law</li>
      </ul>
    `,
  },
  {
    id: "usage",
    title: "5. Acceptable Use Policy",
    icon: <Shield className="h-5 w-5" />,
    content: `
      <h3>5.1 Permitted Uses</h3>
      <p>You may use SprintiQ for:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Creating and managing user stories for software development projects</li>
        <li>Sprint planning and agile project management</li>
        <li>Team collaboration and project organization</li>
        <li>Business purposes consistent with the Service's intended functionality</li>
      </ul>
      
      <h3>5.2 Beta-Specific Prohibited Activities</h3>
      <p>In addition to general prohibited activities, Beta users may not:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Share Beta access credentials with non-authorized users</li>
        <li>Publicly review or benchmark the Service during Beta period without prior written consent</li>
        <li>Use the Service for production or mission-critical applications during Beta</li>
        <li>Attempt to reverse engineer Beta features or algorithms</li>
        <li>Share confidential Beta features or roadmap information publicly</li>
        <li>Use automated tools to stress-test Beta infrastructure</li>
        <li>Violate Beta user limits of 5 team members</li>
      </ul>
      
      <h3>5.3 Beta Feedback and Improvement</h3>
      <p>Beta users are encouraged to:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Provide constructive feedback through in-app feedback tools</li>
        <li>Report bugs and issues promptly through designated channels</li>
        <li>Participate in user research sessions and surveys</li>
        <li>Test new features and provide usability feedback</li>
        <li>Engage respectfully with the Beta community</li>
      </ul>
      
      <h3>5.4 Content Standards</h3>
      <p>All content you submit must:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Be accurate and not misleading</li>
        <li>Not infringe on intellectual property rights</li>
        <li>Not contain offensive, discriminatory, or inappropriate material</li>
        <li>Comply with applicable laws and regulations</li>
        <li>Not include confidential information of third parties without authorization</li>
      </ul>
    `,
  },
  {
    id: "intellectual-property",
    title: "6. Intellectual Property Rights",
    icon: <FileText className="h-5 w-5" />,
    content: `
      <h3>6.1 Our Intellectual Property</h3>
      <p>SprintiQ and all related technology, software, content, and materials are owned by us or our licensors. This includes:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>The SprintiQ platform, software, and algorithms</li>
        <li>Trademarks, logos, and branding materials</li>
        <li>AI models, training data, and generated outputs</li>
        <li>Documentation, tutorials, and support materials</li>
        <li>All improvements and derivative works</li>
      </ul>
      
      <h3>6.2 Your Content</h3>
      <p>You retain ownership of content you create or upload ("User Content"), including:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Project information and requirements</li>
        <li>User stories and acceptance criteria</li>
        <li>Custom templates and configurations</li>
        <li>Team and organizational data</li>
      </ul>
      
      <h3>6.3 License Grants</h3>
      <p><strong>To You:</strong> We grant you a limited, non-exclusive, non-transferable license to use SprintiQ during your subscription period, subject to these Terms.</p>
      <br/><p><strong>To Us:</strong> You grant us a worldwide, non-exclusive license to use your User Content to:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Provide and improve the Service</li>
        <li>Generate AI-powered recommendations and insights</li>
        <li>Create aggregated and anonymized analytics</li>
        <li>Ensure platform security and compliance</li>
      </ul>
      
      <h3>6.4 AI-Generated Content</h3>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Stories and content generated by our AI features are provided for your use</li>
        <li>You may edit, modify, and use AI-generated content for your projects</li>
        <li>We do not claim ownership of specific AI outputs created for your account</li>
        <li>AI-generated content is provided "as-is" without warranties</li>
      </ul>
    `,
  },
  {
    id: "integrations",
    title: "7. Third-Party Integrations",
    icon: <Share2 className="h-5 w-5" />,
    content: `
      <h3>7.1 Platform Integrations</h3>
      <p>SprintiQ integrates with third-party platforms including:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Jira (Atlassian)</li>
        <li>Azure DevOps (Microsoft)</li>
        <li>Linear</li>
        <li>Asana</li>
        <li>GitHub</li>
        <li>ClickUp</li>
        <li>Trello (Atlassian)</li>
        <li>Monday.com</li>
      </ul>
      
      <h3>7.2 Third-Party Terms</h3>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Your use of integrated platforms is subject to their respective terms of service</li>
        <li>We are not responsible for third-party platform availability or functionality</li>
        <li>Integration features may change based on third-party API modifications</li>
        <li>You must have valid accounts and permissions for integrated platforms</li>
      </ul>
      
      <h3>7.3 Beta Integration Limitations</h3>
      <p><strong>Beta Platform Integrations:</strong> During the Beta period, integrations include:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Jira (Atlassian) - Full bi-directional sync (import and export)</li>
        <li>Azure DevOps (Microsoft) - Full bi-directional sync (import and export)</li>
      </ul>
      
      <br/><p><strong>Jira and Azure DevOps Beta Features:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Import existing user stories and work items from connected platforms</li>
        <li>Export SprintiQ-generated stories to create new issues/work items</li>
        <li>Real-time sync status monitoring and conflict resolution</li>
        <li>Field mapping customization for seamless data transfer</li>
        <li>Bulk operations for efficient data management</li>
      </ul>
      
      <br/><p><strong>Post-Beta Integration Roadmap:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Linear, Asana, GitHub, ClickUp, Trello, Monday.com integrations planned for general availability</li>
        <li>Enhanced integration features based on Beta user feedback</li>
        <li>Enterprise integrations available with paid plans post-Beta</li>
        <li>Custom integration development for Enterprise customers</li>
      </ul>
      
      <br/><p><strong>Beta Integration Disclaimers:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Integration reliability may vary during Beta testing</li>
        <li>Data sync failures may occur and will be addressed promptly</li>
        <li>Integration features may change based on user feedback</li>
        <li>We recommend backing up important data before using Beta integrations</li>
      </ul>
    `,
  },
  {
    id: "privacy",
    title: "8. Privacy and Data Protection",
    icon: <ShieldCheck className="h-5 w-5" />,
    content: `
      <h3>8.1 Privacy Policy</h3>
      <p>Our collection, use, and protection of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.</p>
      
      <h3>8.2 Data Security</h3>
      <p>We implement industry-standard security measures including:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Encryption of data in transit and at rest</li>
        <li>Regular security audits and assessments</li>
        <li>Access controls and authentication measures</li>
        <li>Incident response and breach notification procedures</li>
      </ul>
      
      <h3>8.3 Data Location and Transfer</h3>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Your data may be processed and stored in various countries</li>
        <li>We comply with applicable data protection laws including GDPR and CCPA</li>
        <li>International data transfers are protected by appropriate safeguards</li>
        <li>You consent to necessary data transfers for Service provision</li>
      </ul>
      
      <h3>8.4 Data Retention</h3>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>We retain your data as long as your account is active</li>
        <li>Data may be retained for legitimate business purposes after account termination</li>
        <li>You may request data deletion subject to legal and operational requirements</li>
        <li>Aggregated and anonymized data may be retained indefinitely</li>
      </ul>
    `,
  },
  {
    id: "ai-processing",
    title: "9. AI and Algorithmic Processing",
    icon: <BrainCircuit className="h-5 w-5" />,
    content: `
      <h3>9.1 AI Technology</h3>
      <p>SprintiQ uses advanced AI technology, including:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Large language models for story generation</li>
        <li>Machine learning algorithms for prioritization</li>
        <li>Natural language processing for content analysis</li>
        <li>Predictive analytics for risk assessment</li>
      </ul>
      
      <h3>9.2 AI Limitations and Disclaimers</h3>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>AI-generated content is not guaranteed to be accurate or error-free</li>
        <li>Human review and validation of AI outputs is recommended</li>
        <li>AI suggestions are advisory and should not replace professional judgment</li>
        <li>We continuously improve AI models but cannot eliminate all errors</li>
      </ul>
      
      <h3>9.3 Beta-Specific AI Limitations</h3>
      <p><strong>Beta AI Features:</strong> During the Beta period, AI functionality includes:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Unlimited story generation with advanced AI algorithms</li>
        <li>Intelligent prioritization with customizable weighting</li>
        <li>Advanced persona-based story generation</li>
        <li>Automated story point estimation and dependency detection</li>
        <li>AI-powered sprint planning and risk assessment</li>
      </ul>
      
      <br/><p><strong>Beta AI Disclaimers:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>AI models are continuously being trained and improved during Beta</li>
        <li>Story generation quality may vary as we optimize algorithms</li>
        <li>Beta AI suggestions are for testing and feedback purposes only</li>
        <li>Production-grade AI features will be available in general release</li>
        <li>We may reset or modify AI behavior based on Beta feedback</li>
      </ul>
    `,
  },
  {
    id: "modifications",
    title: "10. Service Modifications and Updates",
    icon: <CircleFadingArrowUp className="h-5 w-5" />,
    content: `
      <h3>10.1 Right to Modify</h3>
      <p>We reserve the right to:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Add, modify, or remove Service features</li>
        <li>Update user interfaces and functionality</li>
        <li>Change API endpoints and integration methods</li>
        <li>Implement new security measures</li>
        <li>Modify pricing for new subscriptions</li>
      </ul>
      
      <h3>10.2 Notice of Changes</h3>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Material changes will be communicated via email or platform notifications</li>
        <li>Pricing changes require 30 days advance notice</li>
        <li>Feature deprecations will include reasonable transition periods</li>
        <li>Emergency security updates may be implemented without advance notice</li>
      </ul>
      
      <h3>10.3 Backward Compatibility</h3>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>We strive to maintain backward compatibility when possible</li>
        <li>API changes will include versioning and deprecation notices</li>
        <li>Migration tools and documentation will be provided when feasible</li>
        <li>Legacy features may be sunset with appropriate notice periods</li>
      </ul>
    `,
  },
  {
    id: "termination",
    title: "11. Account Termination",
    icon: <AlertTriangle className="h-5 w-5" />,
    content: `
      <h3>11.1 Termination by You</h3>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>You may cancel your subscription at any time through your account settings</li>
        <li>Cancellation takes effect at the end of your current billing period</li>
        <li>No refunds are provided for unused subscription time</li>
        <li>You may export your data before account termination</li>
      </ul>
      
      <h3>11.2 Termination by Us</h3>
      <p>We may suspend or terminate your account immediately if you:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Violate these Terms or our Acceptable Use Policy</li>
        <li>Fail to pay subscription fees</li>
        <li>Engage in fraudulent or illegal activities</li>
        <li>Pose a security risk to our platform or other users</li>
        <li>Use the Service in ways that harm our business or reputation</li>
      </ul>
      
      <h3>11.3 Beta Program Termination</h3>
      <p><strong>End of Beta Program:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Beta program will conclude upon general availability launch (estimated 6 months)</li>
        <li>Beta users will receive 30 days advance notice of Beta program conclusion</li>
        <li>All Beta user data will be preserved and migrated to production systems</li>
        <li>Beta users must choose a subscription plan or accept Free tier limitations</li>
        <li>Failure to select a plan results in automatic enrollment in Free tier</li>
      </ul>
      
      <br/><p><strong>Early Beta Termination:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>We reserve the right to conclude Beta program early with 30 days notice</li>
        <li>Beta access may be revoked for violation of Beta-specific terms</li>
        <li>Individual Beta access may be terminated for misuse or abuse</li>
        <li>Upon Beta termination, standard subscription terms apply</li>
      </ul>
    `,
  },
  {
    id: "disclaimers",
    title: "12. Disclaimers and Warranties",
    icon: <ShieldAlert className="h-5 w-5" />,
    content: `
      <h3>12.1 Service Disclaimer</h3>
      <p><strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE EXPRESSLY DISCLAIM ALL WARRANTIES, INCLUDING:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE</li>
        <li>NON-INFRINGEMENT OF THIRD-PARTY RIGHTS</li>
        <li>ACCURACY, COMPLETENESS, OR RELIABILITY OF CONTENT</li>
        <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
        <li>SECURITY OR PRIVACY PROTECTION</li>
      </ul>
      
      <h3>12.2 AI and Content Disclaimers</h3>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>AI-generated content may contain errors, biases, or inaccuracies</li>
        <li>We do not warrant the quality or suitability of AI outputs for any purpose</li>
        <li>Users should review and validate all generated content</li>
        <li>AI recommendations are advisory and not professional advice</li>
      </ul>
      
      <h3>12.3 Beta Service Disclaimers</h3>
      <p><strong>Beta-Specific Disclaimers:</strong> <strong>THE BETA SERVICE IS PROVIDED FOR TESTING AND EVALUATION PURPOSES ONLY. IN ADDITION TO OTHER DISCLAIMERS, WE SPECIFICALLY DISCLAIM:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>PRODUCTION-READINESS OF BETA FEATURES</li>
        <li>RELIABILITY OF BETA INTEGRATIONS AND DATA SYNC</li>
        <li>COMPLETENESS OF BETA FUNCTIONALITY</li>
        <li>STABILITY OF BETA USER INTERFACE AND WORKFLOWS</li>
        <li>ACCURACY OF BETA AI ALGORITHMS AND SUGGESTIONS</li>
        <li>AVAILABILITY GUARANTEES DURING BETA PERIOD</li>
      </ul>
      
      <br/><p><strong>Beta User Acknowledgment:</strong> By participating in the Beta program, you acknowledge that:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Beta features may not function as intended or described</li>
        <li>Data loss, though unlikely, is possible during Beta testing</li>
        <li>Service interruptions may occur more frequently than in production</li>
        <li>Beta feedback is voluntary but highly valued for product improvement</li>
        <li>Beta access is a privilege that may be revoked for misuse</li>
      </ul>
    `,
  },
  {
    id: "limitation",
    title: "13. Limitation of Liability",
    icon: <Handshake className="h-5 w-5" />,
    content: `
      <h3>13.1 Limitation of Damages</h3>
      <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
        <li>LOST PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES</li>
        <li>BUSINESS INTERRUPTION OR SYSTEM DOWNTIME</li>
        <li>THIRD-PARTY CLAIMS OR ACTIONS</li>
        <li>DAMAGES RESULTING FROM AI-GENERATED CONTENT</li>
      </ul>
      
      <h3>13.2 Maximum Liability</h3>
      <p><strong>OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE AMOUNTS PAID BY YOU FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM.</strong></p>
      
      <h3>13.3 Exceptions</h3>
      <p>These limitations do not apply to:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Gross negligence or willful misconduct</li>
        <li>Death or personal injury caused by our negligence</li>
        <li>Liability that cannot be excluded by applicable law</li>
        <li>Our indemnification obligations under these Terms</li>
      </ul>
    `,
  },
  {
    id: "indemnification",
    title: "14. Indemnification",
    icon: <ShieldAlert className="h-5 w-5" />,
    content: `
      <p>You agree to indemnify, defend, and hold harmless SprintiQ, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorney fees) arising from or relating to:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Your use of the Service</li>
        <li>Your violation of these Terms</li>
        <li>Your User Content or data</li>
        <li>Your violation of applicable laws or third-party rights</li>
        <li>Your negligent or wrongful conduct</li>
      </ul>
      <p>This indemnification obligation survives termination of these Terms and your use of the Service.</p>
    `,
  },
  {
    id: "dispute-resolution",
    title: "15. Dispute Resolution",
    icon: <UsersRound className="h-5 w-5" />,
    content: `
      <h3>15.1 Informal Resolution</h3>
      <p>Before initiating formal proceedings, you agree to attempt to resolve disputes through direct communication with our support team at support@sprintiq.ai.</p>
      
      <h3>15.2 Binding Arbitration</h3>
      <p>Any dispute, claim, or controversy arising from or relating to these Terms or the Service shall be resolved through binding arbitration rather than in court, except as specified below.</p>
      
      <br/><p><strong>Arbitration Rules:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Arbitration will be conducted by an arbitration organization of our choice</li>
        <li>The arbitration will be held in Missouri or conducted remotely</li>
        <li>The arbitration will be conducted in English</li>
        <li>The arbitrator's decision will be final and binding</li>
      </ul>
      
      <h3>15.3 Class Action Waiver</h3>
      <p><strong>YOU AGREE THAT DISPUTES WILL BE RESOLVED ON AN INDIVIDUAL BASIS AND WAIVE YOUR RIGHT TO PARTICIPATE IN CLASS ACTIONS, COLLECTIVE ARBITRATIONS, OR REPRESENTATIVE PROCEEDINGS.</strong></p>
      
      <h3>15.4 Exceptions</h3>
      <p>The following disputes are not subject to arbitration:</p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Disputes in small claims court within jurisdictional limits</li>
        <li>Intellectual property disputes</li>
        <li>Injunctive relief requests</li>
        <li>Disputes that cannot be arbitrated under applicable law</li>
      </ul>
    `,
  },
  {
    id: "governing-law",
    title: "16. Governing Law",
    icon: <Scale className="h-5 w-5" />,
    content: `
      <p>These Terms are governed by and construed in accordance with the laws of Missouri, without regard to conflict of law principles. Any legal action not subject to arbitration must be brought in the state or federal courts located in Missouri.</p>
    `,
  },
  {
    id: "general-provisions",
    title: "17. General Provisions",
    icon: <FileText className="h-5 w-5" />,
    content: `
      <h3>17.1 Entire Agreement</h3>
      <p>These Terms, together with our Privacy Policy and any additional terms referenced herein, constitute the entire agreement between you and SprintiQ regarding the Service.</p>
      
      <h3>17.2 Modification</h3>
      <p>We may modify these Terms at any time by posting the updated version on our website. Material changes will be communicated via email or platform notifications. Continued use of the Service after changes constitutes acceptance of the modified Terms.</p>
      
      <h3>17.3 Severability</h3>
      <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect, and the unenforceable provision will be modified to be enforceable while preserving its original intent.</p>
      
      <h3>17.4 No Waiver</h3>
      <p>Our failure to enforce any provision of these Terms does not constitute a waiver of that provision or any other provision.</p>
      
      <h3>17.5 Assignment</h3>
      <p>You may not assign or transfer your rights under these Terms without our written consent. We may assign these Terms to any affiliate or successor entity.</p>
      
      <h3>17.6 Force Majeure</h3>
      <p>We are not liable for any failure or delay in performance due to circumstances beyond our reasonable control, including natural disasters, government actions, or third-party service failures.</p>
      
      <h3>17.7 Survival</h3>
      <p>Provisions that by their nature should survive termination will remain in effect after these Terms end, including intellectual property rights, disclaimers, limitations of liability, and dispute resolution.</p>
    `,
  },
  {
    id: "contact",
    title: "18. Contact Information",
    icon: <Mail className="h-5 w-5" />,
    content: `
      <p>For questions about these Terms or the Service, please contact us:</p>
      <p><strong>SprintiQ Support</strong><br/>
      Email: support@sprintiq.ai</p>
      
      <p>For legal notices:<br/>
      Email: support@sprintiq.ai</p>
    `,
  },
  {
    id: "beta-specific",
    title: "19. Beta Program Specific Provisions",
    icon: <CircleAlert className="h-5 w-5" />,
    content: `
      <h3>19.1 Beta User Rights and Responsibilities</h3>
      <p><strong>Beta User Benefits:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Free access to SprintiQ during Beta period (no credit card required)</li>
        <li>Unlimited stories and projects with up to 5 team members</li>
        <li>Full bi-directional integration with Jira and Azure DevOps</li>
        <li>30% lifetime discount on future paid plans</li>
        <li>Early access to new features and integrations</li>
        <li>Direct communication channel with product development team</li>
        <li>Priority consideration for feature requests and feedback</li>
      </ul>
      
      <br/><p><strong>Beta User Responsibilities:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Provide constructive feedback through designated channels</li>
        <li>Report bugs and issues in a timely manner</li>
        <li>Participate in user research when requested</li>
        <li>Maintain confidentiality of unreleased features</li>
        <li>Use the Service responsibly and within stated limitations</li>
      </ul>
      
      <h3>19.2 Beta Data and Privacy</h3>
      <p><strong>Beta Data Handling:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>All Beta user data will be preserved through general availability transition</li>
        <li>Beta usage data helps improve AI algorithms and user experience</li>
        <li>Anonymized Beta feedback may be used for marketing and case studies</li>
        <li>Beta users may opt out of certain data collection practices</li>
        <li>Data export functionality remains available throughout Beta period</li>
      </ul>
      
      <br/><p><strong>Beta Confidentiality:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Beta features and roadmap information should not be shared publicly</li>
        <li>Beta users may discuss general experiences but not specific unreleased features</li>
        <li>Screenshots of Beta features should not be shared without permission</li>
        <li>Beta user feedback may be quoted in marketing materials (with consent)</li>
      </ul>
      
      <h3>19.3 Beta Support and Communication</h3>
      <p><strong>Beta Support Channels:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Dedicated Beta support email: support@sprintiq.ai</li>
        <li>In-app feedback and bug reporting tools</li>
        <li>Monthly Beta user surveys and feedback sessions</li>
        <li>Optional participation in user interviews and testing sessions</li>
        <li>Beta community access for peer support and discussion</li>
      </ul>
      
      <br/><p><strong>Communication Preferences:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Weekly product updates and release notes</li>
        <li>Monthly Beta program newsletters</li>
        <li>Advance notice of new features and testing opportunities</li>
        <li>Direct access to product team for critical issues</li>
      </ul>
      
      <h3>19.4 Beta Program Evolution</h3>
      <p><strong>Feature Development:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Beta features may change significantly based on user feedback</li>
        <li>New features will be gradually rolled out to Beta users</li>
        <li>Feature deprecation will include advance notice and migration paths</li>
        <li>Beta user input directly influences product roadmap priorities</li>
        <li>General availability features may differ from Beta versions</li>
      </ul>
      
      <br/><p><strong>Graduation to General Availability:</strong></p>
      <ul class="list-disc list-inside space-y-2 mt-4">
        <li>Beta program estimated duration: 6 months from launch</li>
        <li>30-day notice before transition to general availability</li>
        <li>Seamless data migration and account transition</li>
        <li>Continued access to Beta-exclusive benefits post-launch</li>
        <li>Option to upgrade to paid plans or continue with Free tier</li>
      </ul>
    `,
  },
  {
    id: "updates",
    title: "20. Updates and Modifications",
    icon: <Calendar className="h-5 w-5" />,
    content: `
      <p><strong>Version History:</strong></p>
      <p>Version 1.0: 23 June 2025 - Initial Terms of Service</p>
      <p>We will maintain a record of material changes to these Terms and notify users of significant updates as required by law and our commitment to transparency.</p>
      
      <br/><p><strong>Last Updated:</strong> 23 June 2023</p>
      
      <p>By using SprintiQ, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
    `,
  },
];

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariant = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const floatingAnimation = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("acceptance");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHoverMenuOpen, setIsHoverMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 overflow-y-auto custom-scrollbar relative">
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* Floating Hover Menu */}
      <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50">
        <div
          className="relative"
          onMouseEnter={() => setIsHoverMenuOpen(true)}
          onMouseLeave={() => setIsHoverMenuOpen(false)}
        >
          {/* Menu Button */}
          <motion.button
            className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 text-emerald-300 p-3 rounded-l-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-500/30 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="h-5 w-5" />
          </motion.button>

          {/* Hover Menu */}
          <motion.div
            className="absolute right-full top-0 mr-2 bg-white/10 backdrop-blur-xl border border-emerald-500/20 rounded-xl shadow-2xl shadow-emerald-500/20 overflow-hidden"
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{
              opacity: isHoverMenuOpen ? 1 : 0,
              x: isHoverMenuOpen ? 0 : 20,
              scale: isHoverMenuOpen ? 1 : 0.95,
            }}
            transition={{ duration: 0.2 }}
            style={{ pointerEvents: isHoverMenuOpen ? "auto" : "none" }}
          >
            <ScrollArea className="p-3 space-y-1 h-[300px]">
              <h3 className="text-emerald-300 font-bold text-sm mb-3 px-2">
                Terms Sections
              </h3>
              {termsSections.map((section, index) => (
                <motion.button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                    activeSection === section.id
                      ? "bg-emerald-500/30 text-emerald-200 border border-emerald-500/40"
                      : "text-emerald-100/80 hover:bg-emerald-500/20 hover:text-emerald-200"
                  }`}
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-emerald-400/70 w-6">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">
                      {section.title.split(". ")[1] || section.title}
                    </span>
                  </div>
                </motion.button>
              ))}
            </ScrollArea>
          </motion.div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <FileText className="w-4 h-4 mr-2" />
              Terms of Service
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <span className="bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent">
                Terms of{" "}
              </span>
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-green-400 bg-clip-text text-transparent">
                Service
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-xl md:text-2xl text-emerald-100/90 max-w-4xl mx-auto mb-12 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Please read these terms carefully before using SprintiQ.ai. By
              using our service, you agree to be bound by these terms.
            </motion.p>

            {/* Stats */}
            <motion.div
              className="flex justify-center items-center space-x-8 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">15</div>
                <div className="text-sm text-emerald-200/70">Sections</div>
              </div>
              <div className="w-px h-8 bg-emerald-500/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">Legal</div>
                <div className="text-sm text-emerald-200/70">Compliance</div>
              </div>
              <div className="w-px h-8 bg-emerald-500/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">24/7</div>
                <div className="text-sm text-emerald-200/70">Support</div>
              </div>
            </motion.div>

            {/* Meta Info */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="flex items-center text-emerald-300 text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                Last updated:{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="flex items-center text-emerald-300 text-sm">
                <Shield className="h-4 w-4 mr-2" />
                Legal & Compliance
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      {/* Table of Contents */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <Card className="bg-white/5 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
            <CardContent className="p-8">
              <motion.h2
                className="text-3xl font-bold text-white mb-8 flex items-center"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <ArrowRight className="h-8 w-8 text-emerald-400 mr-4" />
                Table of Contents
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {termsSections.map((section, index) => (
                  <motion.button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`text-left p-4 rounded-xl transition-all duration-300 group ${
                      activeSection === section.id
                        ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/20"
                        : "bg-white/5 border border-transparent text-emerald-100/80 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg ${
                          activeSection === section.id
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/5 text-emerald-400 group-hover:bg-emerald-500/10"
                        }`}
                      >
                        {section.icon}
                      </div>
                      <div className="font-medium">{section.title}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      {/* Terms Content */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {termsSections.map((section, index) => (
              <motion.div
                key={section.id}
                id={section.id}
                variants={cardVariant}
                className="mb-16"
              >
                {/* Section Header */}
                <motion.div
                  className="flex items-center mb-8"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl border border-emerald-500/30 mr-6">
                    <div className="text-emerald-400">{section.icon}</div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                      {section.title}
                    </h2>
                    <div className="flex items-center mt-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg border border-emerald-500/30 flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-emerald-400">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-emerald-300/70 text-sm">
                        Section {index + 1} of {termsSections.length}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Content Card */}
                <Card className="bg-white/5 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 overflow-hidden">
                  <CardContent className="p-10">
                    <div
                      className="text-emerald-100/90 leading-relaxed prose prose-invert max-w-none text-lg [&>h3]:text-[24px] [&>h3]:font-bold [&>h3]:text-emerald-300 [&>h3]:mb-4 [&>h3]:mt-6"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      <Footer />
      <ScrollToTop isMenuOpen={isMenuOpen} />
    </div>
  );
}

<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into damtowise.xyz, a React + Vite portfolio site. PostHog (`posthog-js` + `@posthog/react`) was installed and initialized in `src/main.tsx` with a `PostHogProvider` wrapping the app. Environment variables were written to `.env.local`. Five custom events were instrumented across four components to capture the most business-critical visitor interactions: hero CTA clicks, contact modal opens, contact method clicks, project link clicks, and footer social clicks.

| Event                    | Description                                                                                                             | File                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `view_projects_clicked`  | Fired when the visitor clicks the "View Projects" CTA in the hero section                                               | `src/app/components/Hero.tsx`         |
| `contact_modal_opened`   | Fired when the visitor opens the contact modal — top of the contact funnel                                              | `src/app/components/Hero.tsx`         |
| `contact_method_clicked` | Fired when the visitor clicks a contact method (Email, LinkedIn, GitHub, etc.); includes `method` and `href` properties | `src/app/components/ContactModal.tsx` |
| `project_link_clicked`   | Fired when a project card is clicked; includes `project_title`, `destination` (`live`/`github`), and `href`             | `src/app/components/Projects.tsx`     |
| `footer_social_clicked`  | Fired when a footer social link is clicked; includes `platform` and `href`                                              | `src/app/components/Footer.tsx`       |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/667292)
- [Contact conversion funnel](/insights/TXM9To7f) — how many visitors who open the modal go on to click a contact method
- [Contact modal opens over time](/insights/tLUNHvru) — daily trend of modal opens
- [Project clicks by project](/insights/4V0rIUl9) — which projects get the most clicks, broken down by title
- [Contact method breakdown](/insights/YXQgDPQn) — which contact methods (Email, LinkedIn, WhatsApp, etc.) are most used
- [Hero CTAs — View Projects vs Contact Me](/insights/KuaZfP6H) — side-by-side comparison of the two hero CTAs over time

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-react-vite/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>

export type SlashKind = 'ui' | 'agent';

export interface SlashCommand {
  name: string; // includes the leading slash
  description: string;
  kind: SlashKind; // 'ui' handled locally, 'agent' sent to Hermes
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { name: '/model', description: 'Switch the active model', kind: 'ui' },
  { name: '/clear', description: 'Clear the conversation', kind: 'ui' },
  { name: '/memory', description: "Inspect the agent's memory", kind: 'agent' },
  { name: '/skills', description: "List the agent's skills", kind: 'agent' },
  { name: '/cron', description: 'Show scheduled tasks', kind: 'agent' },
  { name: '/help', description: 'Show available commands', kind: 'ui' },
];

// Returns matching commands while the user is still typing the command token
// (input starts with "/" and has no space yet). Otherwise returns [].
export function matchSlashCommands(input: string): SlashCommand[] {
  if (!input.startsWith('/') || input.includes(' ') || input.includes('\n')) return [];
  const q = input.slice(1).toLowerCase();
  return SLASH_COMMANDS.filter((c) => c.name.slice(1).toLowerCase().startsWith(q));
}

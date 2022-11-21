import { DiscordRequest } from './utils.js';

export async function HasGuildCommands(appId, guildId, commands) {
  if (guildId === '' || appId === '') return;

  commands.forEach((c) => HasGuildCommand(appId, guildId, c));
}

// Checks for a command
async function HasGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  try {
    const res = await DiscordRequest(endpoint, { method: 'GET' });
    const data = await res.json();

    if (data) {
      const installedNames = data.map((c) => c['name']);
      // This is just matching on the name, so it's not good for updates
      if (!installedNames.includes(command['name'])) {
        console.log(`Installing "${command['name']}"`);
        InstallGuildCommand(appId, guildId, command);
      } else {
        console.log(`"${command['name']}" command already installed`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// Installs a command
export async function InstallGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  // install command
  try {
    await DiscordRequest(endpoint, { method: 'POST', body: command });
  } catch (err) {
    console.error(err);
  }
}

// Simple test command
export const TEST_COMMAND = {
  name: 'test',
  description: 'Basic guild command',
  type: 1,
};

export const EDIT_CHANNEL_COMMAND = {
  "name": "channelperms",
  "type": 1,
  "description": "Edit channel permissions. If you don't set a time, defaults to immediately.",
  "options": [
      {
          "name": "channel",
          "description": "The channel you want to edit",
          "type": 7,
          "required": true,
      },
      {
        "name": "role",
          "description": "The role whose permissions you want to edit",
          "type": 8,
          "required": true,
      },
      {
          "name": "permission",
          "description": "The permission you want to edit",
          "type": 3,
          "required": true
      },
      {
          "name": "permission_level",
          "description": "The permission level you want to set",
          "type": 3,
          "required": true,
          "choices": [
            {
              "name": "Enabled",
              "value": "enabled"
            },
            {
              "name": "Disabled",
              "value": "disabled"
            },
            {
              "name": "Neutral",
              "value": "neutral"
            },
          ]
      },
      {
          "name": "time",
          "description": "Schedule this command to run every day at the specified time.",
          "type": 3,
          "required": false
      }
  ]
}
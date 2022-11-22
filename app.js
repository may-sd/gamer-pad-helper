import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
} from 'discord-interactions';
import { VerifyDiscordRequest, DiscordRequest } from './utils.js';
import {
  CHANNEL_PERMS_COMMAND,
  HasGuildCommands,
} from './commands.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

import { Client, PermissionsBitField } from 'discord.js';

const client = new Client({
    intents: [ (1 << 0), (1 << 9) ]
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

//make sure this line is the last line
client.login(process.env.DISCORD_TOKEN); //login bot using token

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { guild_id, name } = data;
    let error = 'run successful';
    if (name === 'channelperms') {
      const channel_id = data.options[0].value;
      const role_id = data.options[1].value;
      const permission = data.options[2].value;
      const permission_level = parseBoolean(data.options[3].value);
      const time = data.options[4];
      if (typeof time === 'undefined') {
        const channel = client.channels.cache.get(channel_id);
        channel.permissionOverwrites.edit(role_id, { [permission]: permission_level }
        )
        .catch(msg => { error = msg; });
        
        
      }
      else {
        time = time.value;

      }
      
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: error,
        },
      })
    }
  }
});

const parseBoolean = (str) => {
  // i really have no idea why the str is 'enabled' when the value in commands.js is true, false, and null, but whatever. this works for its purpose
  if (str === 'enabled') return true; 
  if (str === 'disabled') return false;
  return null;
}

app.listen(PORT, () => {
  console.log('Listening on port', PORT);

  // Check if guild commands from commands.js are installed (if not, install them)
  HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    CHANNEL_PERMS_COMMAND,
  ]);
});

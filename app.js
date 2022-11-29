import 'dotenv/config';
import express from 'express';
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

import Discord from 'discord.js';
const client = new Discord.Client({
    intents: [ 
      Discord.GatewayIntentBits.Guilds,
      Discord.GatewayIntentBits.GuildIntegrations,
      Discord.GatewayIntentBits.GuildVoiceStates,
      Discord.GatewayIntentBits.GuildMessages
 ]
});
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
client.login(process.env.DISCORD_TOKEN); //login bot using token

const channelID = '1043739156838367242';
const guildID = '675934988075532299';
const roleID = '742973449755951135'
import cron from 'node-cron';

const MINUTES = 60000;

const openChannel = () => {
  const channel = client.channels.cache.get(channelID);
  channel.permissionOverwrites.edit(roleID, { ViewChannel: true, Connect: true });
}

const closeChannel = () => {
  const channel = client.channels.cache.get(channelID);

  channel.permissionOverwrites.edit(roleID, { ViewChannel: false, Connect: false });
  
  console.log('attempting dc...')
  channel.members.each((member) => {
   console.log(member.user.tag);
   member.voice.disconnect();
  });
  console.log('dc attempted');
}

const reminder = () => {
  const channel = client.channels.cache.get(channelID);
  const currentDate = new Date();
  const inFiveMinutes = new Date(currentDate.getTime() + 5*MINUTES);
  const time = inFiveMinutes.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
  channel.send('This voice channel will shut down in 5 minutes (at ' + time + ').');
}

const streamReminder = cron.schedule('55 14 * * 6', () => {
  reminder();
}, {
  timezone: 'America/New_York'
});

const streamClose = cron.schedule('0 15 * * 6', () => {
  closeChannel();
}, {
  timezone: 'America/New_York'
});

const streamOpen = cron.schedule('0 22 * * 6', () => {
  openChannel();
}, {
  timezone: 'America/New_York'
});

const morningOpen = cron.schedule('0 10 * * *', () =>  {
  openChannel();
}, {
  timezone: 'America/New_York'
});

const eveningReminder = cron.schedule('54 23 * * *', () => {
  reminder();
}, {
  timezone: 'America/New_York'
});

const eveningClose = cron.schedule('59 23 * * *', () => {
  closeChannel();
}, {
  timezone: 'America/New_York'
});

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
    if (name === 'channelperms') {
      return res.send({ // eventually want to check if you're admin, then run command as normal. else it'll return this
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Command is currently disabled.',
        },
      })
      
      let error = 'run successful';
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
        error = "i haven't actually implemented this yet because i didn't want to work with databases. lol. lmao, even";
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
  if (str === 'true') return true; 
  if (str === 'false') return false;
  return null;
}

app.listen(PORT, () => {
  console.log('Listening on port', PORT);

  // Check if guild commands from commands.js are installed (if not, install them)
  HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    // CHANNEL_PERMS_COMMAND,
  ]);
});
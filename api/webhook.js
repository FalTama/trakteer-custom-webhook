const express = require('express');
const bodyParser = require('body-parser');
const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent] });

app.use(bodyParser.json());

const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;

app.get("/", (req, res) => {
  res.send("Trakteer webhook server is active! Point the webhook to /trakteer ");
});

app.post("/trakteer", async (req, res) => {
  // Validasi token webhook
  const webhookToken = req.headers['x-webhook-token'];
  if (webhookToken !== WEBHOOK_TOKEN) {
    return res.status(403).send("Forbidden: Invalid webhook token.");
  }

  const { 
    supporter_name, 
    supporter_message, 
    price, 
    unit, 
    quantity, 
    unit_icon, 
    supporter_avatar 
  } = req.body;

  if (!supporter_name || !price) {
    return res.status(400).send("Data is not complete.");
  }

  try {
    const channel = await bot.channels.fetch(process.env.NOTIFICATION_CHANNEL_ID);
    const guild = bot.guilds.cache.first(); 
    const members = await guild.members.fetch(); 

    if (channel) {
      const member = members.find(m => m.user.username === supporter_name);
      let mentionText = member ? `<@${member.id}>` : supporter_name;

      await channel.send({
        content: `🎉 Terima kasih kepada **${mentionText}** atas donasinya! 🥳`,
        embeds: [
          {
            color: 0xff5733,
            title: "🎁 New Donation from Trakteer!",
            description: `Thank you, **${mentionText}**, for your donation of **Rp${price.toLocaleString()}**.`,
            fields: [
              { name: "Message", value: supporter_message || "There was no message.", inline: false },
              { name: "Amount", value: `${quantity} ${unit}`, inline: true },
            ],
            thumbnail: { url: supporter_avatar || "https://trakteer.id/images/v2/stats-1.png" },
            image: unit_icon ? { url: unit_icon } : undefined,
            timestamp: new Date(),
            footer: { text: "Trakteer Notifications" },
          },
        ],
      });
      res.status(200).send("Notification sent.");
    } else {
      res.status(500).send("The channel was not found.");
    }
  } catch (error) {
    console.error("Error while sending embed to Discord:", error);
    res.status(500).send("An error occurred while sending the notification.");
  }
});

bot.once("ready", () => {
  console.log(`Bot is ready as ${bot.user.tag}`);
});

bot.login(process.env.BOT_TOKEN);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

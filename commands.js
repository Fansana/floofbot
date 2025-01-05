const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');


module.exports = [
    {
        name: "update",
        description: "Update the bot!",
        admin: true,
        options: [],
        execute: async function (bot, interaction)
        {
            await interaction.reply({ content: 'Updating!', ephemeral: true });
            pleaseCrashTheBotNowSoTheAutoRebootUpdatesIt();
        }
    },
    {
        name: "leavenotifications",
        description: "Set this channel for notifications that a user has left the server.",
        admin: true,
        options: [],
        execute: async function (bot, interaction)
        {
            client.data.leaveChannel = interaction.channel.id;
            bot.sendMessage({ to: interaction.channel.id, message: "You will be notified here when users leave the server." });
            await interaction.reply({ content: `Channel set to <#${interaction.channel.id}>!`, ephemeral: true });
        }
    },
    {
        name: "startvote",
        description: "Start a new vote!",
        admin: true,
        options: [{ type: 3, name: "title", description: "What's it about?", required: true }, { type: 3, name: "description", description: "When a title is just not enough.", required: false }],
        execute: async function (bot, interaction)
        {
            bot.data.votes = bot.data.votes || {};
            let voteId = "vote" + Date.now();
            bot.data.votes[voteId] = {};

            let text = `# ${interaction.options.getString('title')}\n${(interaction.options.getString('description') ?? "")}`;

            const yesButton = new ButtonBuilder()
                .setCustomId(`voteyes:${voteId}`)
                .setLabel("Yes")
                .setStyle(ButtonStyle.Primary);

            const noButton = new ButtonBuilder()
                .setCustomId(`voteno:${voteId}`)
                .setLabel("No")
                .setStyle(ButtonStyle.Danger);

            const seeButton = new ButtonBuilder()
                .setCustomId(`seevotes:${voteId}`)
                .setLabel("See Votes")
                .setStyle(ButtonStyle.Secondary);
            const endButton = new ButtonBuilder()
                .setCustomId(`endvotes:${voteId}`)
                .setLabel("End Voting")
                .setStyle(ButtonStyle.Danger);

            const voteRow = new ActionRowBuilder()
                .addComponents(yesButton, noButton);
            const adminRow = new ActionRowBuilder()
                .addComponents(seeButton, endButton);

            interaction.reply(
                {
                    content: text,
                    components: [voteRow, adminRow]
                });
        }
    }
];
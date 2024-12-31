const { ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const fs = require("fs");

module.exports = [
    {
        name: "seevotes",
        admin: true,
        execute: async function (bot, interaction, voteId)
        {
            bot.data.votes = bot.data.votes || {};
            bot.data.votes[voteId] = bot.data.votes[voteId] || {};
            bot.data.votes[voteId].responses = bot.data.votes[voteId].responses || {};

            let textResponse = "VOTE RESPONSES:";

            const entries = Object.entries(bot.data.votes[voteId].responses);
            entries.forEach(([key, value]) =>
            {
                if (value && value.reason)
                {
                    textResponse += `\n\n${key}\n${value.username} voted ${value.vote}.\nReason given:\n${value.reason}`;
                }
            });

            let fileBuffer = Buffer.from(textResponse);
            const embed = new AttachmentBuilder(fileBuffer, { name: "results.txt" });

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }
    },
    {
        name: "endvotes",
        admin: true,
        execute: async function (bot, interaction, voteId)
        {
            bot.data.votes = bot.data.votes || {};
            bot.data.votes[voteId] = bot.data.votes[voteId] || {};
            bot.data.votes[voteId].closed = true;
            bot.data.votes[voteId].responses = bot.data.votes[voteId].responses || {};

            let textResponse = "VOTE RESPONSES:";

            const entries = Object.entries(bot.data.votes[voteId].responses);

            let yes = 0;
            let no = 0;

            entries.forEach(([key, value]) =>
            {
                textResponse += `\n\n${key}\n${value.username} voted ${value.vote}.\nReason given:\n${value.reason}`;
                if (value && value.reason)
                {
                    if (value.vote == "Yes")
                    {
                        yes++;
                    }
                    else
                    {
                        no++;
                    }
                }
            });

            let total = yes + no;

            const embed = new EmbedBuilder()
                .setTitle('Responses')
                .setDescription(textResponse);

            let result = "Tied!";

            if (yes > no)
            {
                result = "Yes";
            }
            if (no > yes)
            {
                result = "No";
            }

            await interaction.reply({
                content: `## Vote closed!\nThe result is...\n# ${result}!\nYes: ${(yes / total) * 100}% (${yes} votes)\nNo: ${(no / total) * 100}% (${no} votes)`
            });
            await interaction.followUp({
                embeds: [embed],
                ephemeral: true
            });
        }
    },
    {
        name: "voteyes",
        admin: false,
        execute: async function (bot, interaction, voteId)
        {
            let responseId = "response" + Date.now();
            bot.data.votes = bot.data.votes || {};
            bot.data.votes[voteId] = bot.data.votes[voteId] || {};

            let userVote = UserHasVoted(bot.data.votes[voteId], interaction.user.tag);
            let changedVote = false;
            let oldText = "";

            if (bot.data.votes[voteId].closed)
            {
                await interaction.reply({ content: 'You can no longer vote on this.', ephemeral: true });
                return;
            }

            if (userVote)
            {
                responseId = userVote.id;
                changedVote = userVote.vote.reason && userVote.vote.vote != "Yes";
                oldText = userVote.vote.reason ?? "";
                userVote.vote.vote = "Yes";
            }
            else
            {
                bot.data.votes[voteId].responses = bot.data.votes[voteId].responses || {};
                bot.data.votes[voteId].responses[responseId] = { vote: "Yes", username: interaction.user.tag };
            }

            const modal = new ModalBuilder()
                .setCustomId(voteId + ":" + responseId)
                .setTitle(changedVote ? "Changed Vote to \"Yes\"" : "Voted \"Yes\"");

            const reasonInput = new TextInputBuilder()
                .setCustomId('reasonInput')
                .setLabel(changedVote ? "Vote changed to \"Yes\"! Update your reason?" : "Your vote requires reasoning to be valid.")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('What is the reason for voting "Yes"?')
                .setRequired(true)
                .setMinLength(50);

            if (oldText && oldText.length >= 50)
                reasonInput.setValue(oldText);

            const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(firstActionRow);
            await interaction.showModal(modal);
        }
    },
    {
        name: "voteno",
        admin: false,
        execute: async function (bot, interaction, voteId)
        {
            let responseId = "response" + Date.now();
            bot.data.votes = bot.data.votes || {};
            bot.data.votes[voteId] = bot.data.votes[voteId] || {};

            let userVote = UserHasVoted(bot.data.votes[voteId], interaction.user.tag);
            let changedVote = false;
            let oldText = "";

            if (bot.data.votes[voteId].closed)
            {
                await interaction.reply({ content: 'You can no longer vote on this.', ephemeral: true });
                return;
            }

            if (userVote)
            {
                responseId = userVote.id;
                changedVote = userVote.vote.reason && userVote.vote.vote != "No";
                oldText = userVote.vote.reason ?? "";
                userVote.vote.vote = "No";
            }
            else
            {
                bot.data.votes[voteId].responses = bot.data.votes[voteId].responses || {};
                bot.data.votes[voteId].responses[responseId] = { vote: "No", username: interaction.user.tag };
            }


            const modal = new ModalBuilder()
                .setCustomId(voteId + ":" + responseId)
                .setTitle(changedVote ? "Changed Vote to \"No\"" : "Voted \"No\"");

            const reasonInput = new TextInputBuilder()
                .setCustomId('reasonInput')
                .setLabel(changedVote ? "Vote changed to \"No\"! Update your reason?" : "Your vote requires reasoning to be valid.")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('What is the reason for voting "No"?')
                .setRequired(true)
                .setMinLength(50);

            if (oldText && oldText.length >= 50)
                reasonInput.setValue(oldText);

            const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(firstActionRow);
            await interaction.showModal(modal);
        }
    }
];

function UserHasVoted (vote, user)
{
    if (!vote.responses)
    {
        return false;
    }

    const entries = Object.entries(vote.responses);
    let found = false;
    entries.forEach(([key, value]) =>
    {
        if (value.username == user)
        {
            found = { id: key, vote: value };
            return;
        }
    });

    return found;
}
import { DMChannel, GuildChannel, Message, TextChannel } from "discord.js";
import {
  BirthdayManager,
  ExportManager,
  Game,
  GroupManager,
  MapTools,
  ReactRole,
  Ticket,
  TopicManager,
  VoiceOnDemand,
} from "../programs";
import { hasRole, textLog } from "../common/moderator";
import {
  abuseMe,
  addVote,
  deleteMessages,
  randomReply,
  sendLove,
} from "../common/custom-methods";
import Tools from "../common/tools";
import {
  dailyChallenge,
  postDailyMessage,
  saveToDb,
} from "../programs/daily-challenge";

const message = async (msg: Message) => {
  if (msg.channel.type === "dm" && !msg.author.bot) {
    return;
  } else {
    await routeMessage(msg);
  }
};

const routeMessage = async (message: Message) => {
  const mentionedMembers = message.mentions.users.size;
  if (mentionedMembers > 20 && !message.author.bot) {
    const whitelistedRoles = ["support", "yes theory", "seek discomfort"];
    const hasWhitelistedRole = message.member.roles.cache.some((r) =>
      whitelistedRoles.includes(r.name.toLowerCase())
    );
    if (hasWhitelistedRole) return;

    message.author.createDM().then((dm: DMChannel) => {
      dm.send(
        "Hey there! You tagged more than 20 people in a single message. The message has been deleted and you have beeen timed out. Here is the message sent: "
      );
      dm.send(message.content);
    });
    await message.delete();
    const timeoutRole = Tools.getRoleByName("Time Out", message.guild);
    const supportRole = Tools.getRoleByName(
      process.env.MODERATOR_ROLE_NAME,
      message.guild
    );
    await message.member.roles.add(timeoutRole);
    textLog(
      `<@&${supportRole.id}>: <@${message.author.id}> just tagged more than 20 people in a single message in <#${message.channel.id}>. The message has been deleted and they have beeen timed out.`
    ).then(() => textLog(`Message content was: ${message.content}`));
  }

  const filteredWords = ["nigger", "nigga"];
  const lowerCaseMessage = message.content.toLowerCase();
  if (filteredWords.some((word) => lowerCaseMessage.includes(word))) {
    await message.delete();
    message.author
      .createDM()
      .then((dm) =>
        dm.send(
          `Usage of the N word is absolutely banned within this server. Please refer to the <#450102410262609943>.`
        )
      );

    return;
  }

  const words = message.content.split(/\s+/);
  const channel = <TextChannel>message.channel;
  const firstWord = words[0];
  const restOfMessage = words.slice(1).join(" ");

  switch (channel.name) {
    case "welcome-chat":
      if (firstWord === "!video") {
        await message.reply("https://youtu.be/v-JOe-xqPN0");
      }
      break;

    case "chat":
    case "chat-too":
    case "4th-chat":
    case "chat-v":
      if (firstWord === "!translate") abuseMe(message);
      break;

    case "trends":
      if (firstWord === "!trend") await TopicManager.topics(message);
      if (firstWord === "!trendSet") await TopicManager.setTopic(message);
      break;

    case "daily-challenge":
      if (firstWord === "!challenge") await dailyChallenge(message);
      break;
    case "permanent-testing":
      if (firstWord === "!export") await ExportManager(message);
      if (
        firstWord === "!group" &&
        !message.content.toLowerCase().startsWith("!group toggle")
      )
        await GroupManager(message, true);
      if (firstWord === "!addChallenge")
        await saveToDb("daily-challenge", restOfMessage, message);
      if (firstWord === "!todayChallenge")
        await postDailyMessage(message.client, message);
      break;
    case "bot-commands":
      if (
        firstWord === "!group" &&
        !message.content.toLowerCase().startsWith("!group toggle")
      )
        await GroupManager(message, true);
      if (firstWord === "!birthday") await BirthdayManager(message);

      if (firstWord === "!voice") await VoiceOnDemand(message);
      if (firstWord === "!video") {
        await message.reply("https://youtu.be/v-JOe-xqPN0");
      }
      if (firstWord === "!map") await MapTools.map(message);
      if (firstWord === "!mapadd") await MapTools.mapAdd(message);
      break;

    case "feature-requests":
      message.react("👍").then(() => message.react("👎"));
      break;

    case "bot-games":
      if (firstWord === "!game") await Game.showGameEmbed(message);
      break;
  }

  const parentChannel = (message.channel as GuildChannel).parent;
  if (
    parentChannel &&
    parentChannel.name.toLowerCase().endsWith("entertainment")
  ) {
    Game.handleGameInput(message);
  }

  if (firstWord === "!goodbye") {
    const guildRole = message.guild.roles.cache.find(
      (r) => r.name.toLowerCase() === "head"
    );
    await message.member.roles.remove(guildRole);
  }
  if (firstWord === "!topic") await TopicManager.topics(message);
  // if (firstWord === "!fiyesta") Ticket(message, "fiyesta");
  if (firstWord === "!shoutout") await Ticket(message, "shoutout");
  if (firstWord === "!addvote") await addVote(message);
  if (firstWord === "!delete")
    hasRole(message.member, "Support") ? await deleteMessages(message) : null;
  if (firstWord === "!role") await ReactRole(message);
  if (firstWord === "F") await message.react("🇫");
  if (
    ["i love u yesbot", "i love you yesbot", "yesbot i love you "].includes(
      message.content.toLowerCase()
    )
  )
    sendLove(message);
  if (
    message.content.toLowerCase().startsWith("yesbot") &&
    message.content.toLowerCase().endsWith("?")
  )
    randomReply(message);
  if (
    message.content.toLowerCase().includes("abooz") ||
    message.content.toLowerCase().includes("mod abuse")
  ) {
    await message.react("👀");
  }

  if (message.content.toLowerCase().startsWith("!group toggle"))
    await GroupManager(message, true);

  if (words.includes("@group")) await GroupManager(message, false);
};

export default message;

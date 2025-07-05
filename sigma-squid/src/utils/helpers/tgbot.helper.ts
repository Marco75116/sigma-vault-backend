import { bot } from "../clients/telegraf.client";
import {
  SIGMA_VAULT_CHANNEL,
  TELEGRAM_MESSAGE_INTERVAL,
  TELEGRAM_MAX_RETRIES,
} from "../constants/tgbot.constant";

class TelegramRateLimiter {
  private messageQueue: Array<{
    chatId: number | string;
    message: string;
    retries: number;
    resolve: (value: void) => void;
    reject: (error: any) => void;
  }> = [];

  private isProcessing = false;
  private lastMessageTime = 0;

  async sendMessage(chatId: number | string, message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.messageQueue.push({
        chatId,
        message,
        retries: 0,
        resolve,
        reject,
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.messageQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const item = this.messageQueue.shift()!;

    try {
      // Calculate delay needed to respect rate limits
      const now = Date.now();
      const timeSinceLastMessage = now - this.lastMessageTime;

      if (timeSinceLastMessage < TELEGRAM_MESSAGE_INTERVAL) {
        const delay = TELEGRAM_MESSAGE_INTERVAL - timeSinceLastMessage;
        await this.sleep(delay);
      }

      await bot.telegram.sendMessage(item.chatId, item.message, {
        parse_mode: "HTML",
        link_preview_options: {
          is_disabled: true,
        },
      });

      this.lastMessageTime = Date.now();
      item.resolve();
    } catch (error: any) {
      // Handle rate limit errors specifically
      if (error.response?.error_code === 429) {
        const retryAfter = error.response.parameters?.retry_after || 1;
        console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);

        if (item.retries < TELEGRAM_MAX_RETRIES) {
          // Add back to queue with incremented retry count
          item.retries++;

          // Wait for the specified retry time plus some buffer
          await this.sleep((retryAfter + 1) * 1000);
          this.messageQueue.unshift(item); // Add to front of queue
        } else {
          console.error(
            `Failed to send message after ${TELEGRAM_MAX_RETRIES} retries:`,
            error
          );
          item.reject(error);
        }
      } else {
        console.error("Error sending message:", error);
        item.reject(error);
      }
    }

    setTimeout(() => this.processQueue(), 100);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getQueueStatus() {
    return {
      queueLength: this.messageQueue.length,
      isProcessing: this.isProcessing,
      lastMessageTime: this.lastMessageTime,
    };
  }

  clearQueue() {
    // Reject all pending messages
    this.messageQueue.forEach((item) => {
      item.reject(new Error("Queue cleared by admin"));
    });

    // Clear the queue
    this.messageQueue = [];

    // Reset processing state
    this.isProcessing = false;
    this.lastMessageTime = 0;

    return {
      success: true,
      message: "Queue cleared successfully",
      clearedItems: this.messageQueue.length,
    };
  }
}

const rateLimiter = new TelegramRateLimiter();

export const getTelegramQueueStatus = () => rateLimiter.getQueueStatus();

export const clearTelegramQueue = () => rateLimiter.clearQueue();

export const sendMessage = async (chatId: number | string, message: string) => {
  try {
    await rateLimiter.sendMessage(chatId, message);
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const sendMessageToSigmaVaultChannel = async (message: string) => {
  await sendMessage(SIGMA_VAULT_CHANNEL, message);
};

export const format = (num: number | undefined, decimals?: number): string => {
  try {
    if (num !== undefined && num !== null && !isNaN(num)) {
      const isBigNumber = num > 999999;

      return new Intl.NumberFormat("en-US", {
        notation: isBigNumber ? "compact" : undefined,
        minimumFractionDigits: decimals || 0,
        maximumFractionDigits: decimals || 0,
      }).format(num);
    } else {
      return "0";
    }
  } catch (error) {
    throw new Error("securdFormat failed : " + error);
  }
};

export const toFormattedPercentage = (
  num: number | undefined,
  decimals?: number | undefined
) => {
  try {
    if (num !== undefined && num !== null && !isNaN(num.valueOf())) {
      let formattedNumber = (num * 100).toFixed(decimals || 0);

      if (decimals !== undefined) {
        formattedNumber = parseFloat(formattedNumber).toString();
      }

      return `${formattedNumber}%`;
    } else {
      return "--";
    }
  } catch (error) {
    console.log("toFormattedPercentage failed : " + error);
  }
};

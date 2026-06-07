"use server";

import { isAdminAuthenticated } from "./admin-auth";
import { getSmsProvider, isSmsRealProviderConfigured } from "./sms";
import { isSmsruConfigured } from "./sms/smsru";
import { isSmscConfigured } from "./sms/smsc";

export type SmsDiagResult = {
  provider: string;
  isReal: boolean;
  smsruConfigured: boolean;
  smscConfigured: boolean;
  envSmsProvider: string;
  envSmsruApiIdSet: boolean;
  envSmscLoginSet: boolean;
};

export async function getSmsDiagAction(): Promise<SmsDiagResult | null> {
  if (!(await isAdminAuthenticated())) return null;

  const provider = getSmsProvider();

  return {
    provider: provider.name,
    isReal: !provider.isDemo,
    smsruConfigured: isSmsruConfigured(),
    smscConfigured: isSmscConfigured(),
    envSmsProvider: process.env.SMS_PROVIDER || "(не задан)",
    envSmsruApiIdSet: !!process.env.SMSRU_API_ID,
    envSmscLoginSet: !!process.env.SMSC_LOGIN,
  };
}

export type SmsTestResult = {
  ok: boolean;
  error?: string;
  providerName: string;
  providerMessageId?: string;
};

export async function testSmsSendAction(phone: string): Promise<SmsTestResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Не авторизован", providerName: "?" };
  }

  const provider = getSmsProvider();
  const result = await provider.sendText(
    phone,
    "ВкусМаркет: тестовое сообщение. Если вы его получили — SMS работает!"
  );

  return {
    ok: result.ok,
    error: result.ok ? undefined : result.error,
    providerName: provider.name,
    providerMessageId: result.ok ? result.providerMessageId : undefined,
  };
}

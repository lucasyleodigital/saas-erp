import type { Metadata } from "next";
import { BankView } from "@/components/bank/bank-view";

export const metadata: Metadata = { title: "Banco" };

export default function BankPage() {
  return <BankView />;
}

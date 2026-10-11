import { Suspense } from "react";
import { ExpensesView } from "@/components/expenses/expenses-view";

export default function GastosPage() {
  return (
    <Suspense>
      <ExpensesView />
    </Suspense>
  );
}

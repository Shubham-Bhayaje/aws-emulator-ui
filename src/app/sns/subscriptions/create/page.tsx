import {
  listTopicsAction,
  getSqsQueuesAction,
  getLambdaFunctionsAction,
} from "../../actions";
import CreateSubscriptionClient from "./CreateSubscriptionClient";

export const dynamic = "force-dynamic";

export default async function CreateSubscriptionPage() {
  const [topicsRes, sqsQueues, lambdaFunctions] = await Promise.all([
    listTopicsAction(),
    getSqsQueuesAction(),
    getLambdaFunctionsAction(),
  ]);

  return (
    <CreateSubscriptionClient
      topics={topicsRes.topics || []}
      sqsQueues={sqsQueues}
      lambdaFunctions={lambdaFunctions}
    />
  );
}

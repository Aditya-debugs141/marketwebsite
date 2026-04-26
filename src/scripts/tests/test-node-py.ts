import { fetchMoneyControlDeals } from '../../server/data-sources/mc-deals';

async function testNodeToPython() {
    console.log("Starting script test...");
    const data = await fetchMoneyControlDeals();
    console.log("RECEIVED:");
    console.log(data);
}
testNodeToPython();

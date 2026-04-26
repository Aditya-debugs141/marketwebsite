
// Note: sentiment-engine module doesn't exist - commenting out for now
// import { SentimentEngine } from './engine/sentiment-engine';

async function main() {
    console.log('Starting debug...');
    console.warn('sentiment-engine module is not available - debug functionality limited');
    // try {
    //     const engine = SentimentEngine.getInstance();
    //     console.log('Engine instance created');
    //     await engine.init();
    //     console.log('Engine initialized');
    //     const result = await engine.analyze('This is a great stock!');
    //     console.log('Analysis result:', result);
    // } catch (error: unknown) {
    //     console.error('Debug failed (Full Error):', error);
    //     if (error instanceof Error) {
    //         console.error('Message:', error.message);
    //         console.error('Stack:', error.stack);
    //     }
    // }
}

main();

import WebSocket from 'ws';
import WebSocketServer from '../webSocketServer';

jest.mock('ws');

describe('WebSocketServer', () => {
  const expectedWebSocketId = 0;

  let wsServer: WebSocket.Server;
  let webSocketServer: WebSocketServer;
  let webSocket: WebSocket;

  let wsMessageCallback: (data: WebSocket.RawData) => void;
  let wsCloseCallback: () => void;

  const getWsCallbacks = () => {
    const maybeMessageCall = jest.mocked(webSocket).on.mock.calls.find(([event]) => event === 'message');
    if (!maybeMessageCall) fail();
    const messageCallback = maybeMessageCall[1];

    const maybeCloseCall = jest.mocked(webSocket).on.mock.calls.find(([event]) => event === 'close');
    if (!maybeCloseCall) fail();
    const closeCallback = maybeCloseCall[1];

    return [messageCallback, closeCallback];
  };

  const setUpWebSocketServer = () => {
    webSocketServer.run();

    const maybeConnectionCall = jest.mocked(wsServer).on.mock.calls.find(([event]) => event === 'connection');
    if (!maybeConnectionCall) fail();
    const connectionCallback = maybeConnectionCall[1] as (ws: WebSocket) => void;

    connectionCallback(webSocket);

    [wsMessageCallback, wsCloseCallback] = getWsCallbacks();
  };

  beforeEach(() => {
    jest.clearAllMocks();

    wsServer = new WebSocket.Server();
    webSocket = new WebSocket('');
    webSocketServer = new WebSocketServer(wsServer);

    setUpWebSocketServer();
  });

  describe('WebSocket message event handler', () => {
    const eventName = 'testEvent';
    const messageObject = { event: eventName, data: 'Data sent by the WebSocket' };
    const messageRaw = JSON.stringify(messageObject);

    let callback: jest.Mock;

    beforeEach(() => {
      callback = jest.fn();
      webSocketServer.addEventHandler(eventName, callback);
    });

    /**
     * @param data Data representing `messageObject`
     */
    const runTest = (data: WebSocket.RawData) => {
      wsMessageCallback(data);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expectedWebSocketId, messageObject.data);
    };

    test('handles Buffer data', () => {
      runTest(Buffer.from(messageRaw));
    });

    test('handles ArrayBuffer data', () => {
      const typedArray = new Uint8Array(messageRaw.split('').map((char) => char.charCodeAt(0)));
      runTest(typedArray.buffer);
    });

    test('handles Buffer array data', () => {
      const splitPoint = Math.floor(messageRaw.length / 2);
      const buffer1 = Buffer.from(messageRaw.slice(0, splitPoint));
      const buffer2 = Buffer.from(messageRaw.slice(splitPoint));
      runTest([buffer1, buffer2]);
    });
  });

  test('can add multiple event handlers', () => {
    const eventName = 'testEvent';
    const messageObject = { event: eventName, data: 123 };
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    webSocketServer.addEventHandler(eventName, callback1);
    webSocketServer.addEventHandler(eventName, callback2);

    wsMessageCallback(Buffer.from(JSON.stringify(messageObject)));

    [callback1, callback2].forEach((callback) => {
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expectedWebSocketId, messageObject.data);
    });
  });

  describe('removeEventHandler', () => {
    test.todo('can remove a single event handler');
    test.todo('noop when handler does not exist');
  });

  describe('sendMessage', () => {
    test.todo('sends the message if the WebSocket connection is open');
    test.todo('does not send the message if the WebSocket connection is not open');
    test.todo('throws an error if a nonexistent ID is provided');
  });
});

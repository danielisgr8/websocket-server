import WebSocket from 'ws';
import WebSocketServer from '../webSocketServer';

jest.mock('ws');

describe('WebSocketServer', () => {
  const exampleEventName = 'testEvent';
  const exampleMessageObject = { event: exampleEventName, data: 'Data sent by the WebSocket' };
  const exampleMessageString = JSON.stringify(exampleMessageObject);
  const exampleMessageBuffer = Buffer.from(exampleMessageString);

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
    let callback: jest.Mock;

    beforeEach(() => {
      callback = jest.fn();
      webSocketServer.addEventHandler(exampleEventName, callback);
    });

    /**
     * @param data Data representing `messageObject`
     */
    const runTest = (data: WebSocket.RawData) => {
      wsMessageCallback(data);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expectedWebSocketId, exampleMessageObject.data);
    };

    test('handles Buffer data', () => {
      runTest(exampleMessageBuffer);
    });

    test('handles ArrayBuffer data', () => {
      const typedArray = new Uint8Array(exampleMessageString.split('').map((char) => char.charCodeAt(0)));
      runTest(typedArray.buffer);
    });

    test('handles Buffer array data', () => {
      const splitPoint = Math.floor(exampleMessageString.length / 2);
      const buffer1 = Buffer.from(exampleMessageString.slice(0, splitPoint));
      const buffer2 = Buffer.from(exampleMessageString.slice(splitPoint));
      runTest([buffer1, buffer2]);
    });
  });

  test('can add multiple event handlers', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    webSocketServer.addEventHandler(exampleEventName, callback1);
    webSocketServer.addEventHandler(exampleEventName, callback2);

    wsMessageCallback(exampleMessageBuffer);

    [callback1, callback2].forEach((callback) => {
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expectedWebSocketId, exampleMessageObject.data);
    });
  });

  describe('removeEventHandler', () => {
    test('can remove a single event handler', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      webSocketServer.addEventHandler(exampleEventName, callback1);
      webSocketServer.addEventHandler(exampleEventName, callback2);

      webSocketServer.removeEventHandler(exampleEventName, callback1);
      wsMessageCallback(exampleMessageBuffer);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    test('noop when handler does not exist', () => {
      const callback = jest.fn();
      webSocketServer.removeEventHandler(exampleEventName, callback);

      wsMessageCallback(exampleMessageBuffer);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    test.todo('sends the message if the WebSocket connection is open');
    test.todo('does not send the message if the WebSocket connection is not open');
    test.todo('throws an error if a nonexistent ID is provided');
  });
});

interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
  roomFull: () => void;
  roomJoined: () => void;
  newUserJoined: () => void;
  createOffer: ({roomName, sdp}: {roomName: string, sdp: any}) => void;
  createAnswer: ({roomName, sdp}: {roomName: string, sdp: any}) => void;
  iceCandidateExchange: ({roomName, candidate}: {roomName: string, candidate: RTCIceCandidate}) => void;
  userLeft: () => void;
    addNewRoom: (roomName: string) => void;

}

interface ClientToServerEvents {
  hello: () => void;
  joinRoom: (roomName: string) => void;
  createOffer: ({roomName, sdp}: {roomName: string, sdp: any}) => void;
  createAnswer: ({roomName, sdp}: {roomName: string, sdp: any}) => void;
  iceCandidateExchange: ({roomName, candidate}: {roomName: string, candidate: RTCIceCandidate}) => void;
  leaveRoom: (roomName: string) => void;
  newRoomCreated: (roomName: string) => void;

}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}
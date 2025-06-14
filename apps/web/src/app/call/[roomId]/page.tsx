'use client';

import { useParams } from 'next/navigation';
import { CallRoom } from '../../../components/call/CallRoom';

export default function CallPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return (
    <div className="container mx-auto p-4">
      <CallRoom roomId={roomId} />
    </div>
  );
} 
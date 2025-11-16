'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import EventCreateDialog from './EventCreateDialog';
import type { EventItem } from '@/lib/types';

type UserRole = 'user' | 'coach' | 'admin';

type Props = {
  userRole: UserRole;
};

export default function CreateEventButton({ userRole }: Props) {
  const [openCreate, setOpenCreate] = useState(false);

  // Only allow for coaches or admins
  if (userRole === 'user') return null;

  return (
    <>
      <button
        onClick={() => setOpenCreate(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-[#C5133D] px-4 py-2 text-sm font-medium text-white hover:brightness-110 transition"
      >
        <Plus className="h-4 w-4" />
        Crear Evento
      </button>

      <EventCreateDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
      />
    </>
  );
}

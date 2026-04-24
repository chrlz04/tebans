import React from 'react'

interface AvatarProps {
  firstName: string
  lastName: string
  className?: string
}

export default function Avatar({ firstName, lastName, className = '' }: AvatarProps) {
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  return (
    <div className={`flex items-center justify-center bg-primary-100 text-primary-700 font-semibold rounded-full w-10 h-10 shrink-0 ${className}`}>
      {initials}
    </div>
  )
}

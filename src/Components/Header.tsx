import React from 'react'
import StatutVip from './StatutVip'

type Role = 'user' | 'admin'

interface HeaderProps {
    nom: string
    role: Role
    vipActif: boolean
    vipCharge: boolean

    onOpenSubscription: () => void
    onLogout: () => void
}

export default function Header({

    nom,
    role,
    vipActif,
    vipCharge,

    onOpenSubscription,
    onLogout

}: HeaderProps) {

    return (

        <div className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 z-40 px-4 py-2">

            <div className="max-w-2xl mx-auto flex items-center justify-between">

                <span className="text-orange-400 font-black text-sm">

                    CAPNEX PRO

                </span>

                <div className="flex items-center gap-3">

                    <span className="text-gray-500 text-xs">

                        {nom}

                    </span>

                    <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-lg ${role === 'admin'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400'
                            }`}
                    >

                        {role === 'admin'
                            ? 'ADMIN'
                            : 'USER'}

                    </span>

                    {

                        role !== 'admin' && (
                            <StatutVip
                                vipActif={vipActif}
                                vipCharge={vipCharge}
                                onOpenSubscription={onOpenSubscription}
                            />
                        )

                    }

                    <button

                        onClick={onLogout}

                        className="text-gray-600 hover:text-red-400 text-xs"

                    >

                        Déconnexion

                    </button>

                </div>

            </div>

        </div>

    )

}
import { useEffect, useState } from 'react'

import {
    paymentsAPI,
    subscriptionsAPI,
    type PaymentResponse,
    type SubscriptionPlan,
    type SubscriptionResponse,
    type PaymentProvider,
} from '../service/api'

type SubscriptionProps = {
    currentSubscription: SubscriptionResponse | null
    onBack: () => void
    onSubscriptionActivated: () => void | Promise<void>
}

export default function Subscription({
    currentSubscription,
    onBack,
    onSubscriptionActivated,
}: SubscriptionProps) {

    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [paymentMethod, setPaymentMethod] = useState<PaymentProvider | null>(null)

    /*
     * Cette variable est utilisée uniquement pour
     * la souscription PENDING en cours de paiement.
     */
    const [subscription, setSubscription] =
        useState<SubscriptionResponse | null>(null)

    const [payment, setPayment] =
        useState<PaymentResponse | null>(null)

    const [paymentHistory, setPaymentHistory] =
        useState<PaymentResponse[]>([])

    const [loadingHistory, setLoadingHistory] =
        useState(false)

    const [historyError, setHistoryError] =
        useState('')

    const [phoneNumber, setPhoneNumber] =
        useState('')

    const [otp, setOtp] =
        useState('')

    const [loadingPlans, setLoadingPlans] =
        useState(true)

    const [processing, setProcessing] =
        useState(false)

    const [checkingStatus, setCheckingStatus] =
        useState(false)

    const [error, setError] =
        useState('')

    /*
     * Détermine si l'utilisateur possède
     * actuellement un abonnement VIP valide.
     */
    const vipActif =
        currentSubscription?.status === 'ACTIVE'
        && currentSubscription.valid

    /*
     * Au chargement de la page :
     *
     * - VIP actif → pas besoin de charger les offres.
     * - PENDING → on reprend le paiement.
     * - Sinon → on charge les offres.
     */
    useEffect(() => {

        if (vipActif) {
            setLoadingPlans(false)
            return
        }

        const initialiserPage = async () => {

            try {

                setLoadingPlans(true)
                setError('')

                /*
                 * Si App.tsx connaît déjà une
                 * souscription PENDING, on la réutilise.
                 */
                if (
                    currentSubscription?.status === 'PENDING'
                ) {
                    setSubscription(
                        currentSubscription
                    )
                }

                /*
                 * Chargement des offres.
                 */
                const plansData =
                    await subscriptionsAPI.getPlans()

                setPlans(
                    plansData.filter(
                        plan => plan.type !== 'FREE'
                    )
                )

                /*
                 * Si App.tsx n'avait pas connaissance
                 * d'une souscription PENDING,
                 * on vérifie côté backend.
                 */
                if (!currentSubscription) {

                    try {

                        const subscriptionCourante =
                            await subscriptionsAPI.getCurrent()

                        if (
                            subscriptionCourante.status
                            === 'PENDING'
                        ) {

                            setSubscription(
                                subscriptionCourante
                            )
                        }

                    } catch {
                        /*
                         * Aucune souscription :
                         * situation normale pour un FREE.
                         */
                    }
                }

            } catch (e) {

                setError(
                    getErrorMessage(e)
                )

            } finally {

                setLoadingPlans(false)
            }
        }

        void initialiserPage()

    }, [currentSubscription, vipActif])

    useEffect(() => {
        if (
            !currentSubscription ||
            currentSubscription.status !== 'ACTIVE'
        ) {
            return
        }

        const chargerHistoriquePaiements = async () => {
            try {
                setLoadingHistory(true)
                setHistoryError('')

                const data =
                    await paymentsAPI.getMyPayments()

                setPaymentHistory(data)

            } catch (error) {

                console.error(
                    "Impossible de charger l'historique des paiements",
                    error
                )

                setHistoryError(
                    error instanceof Error
                        ? error.message
                        : "Impossible de charger l'historique"
                )

            } finally {
                setLoadingHistory(false)
            }
        }

        void chargerHistoriquePaiements()

    }, [currentSubscription])

    /*
     * ================================
     * CHOIX D'UN PLAN
     * ================================
     */
    const choisirPlan = async (
        plan: SubscriptionPlan
    ) => {

        try {

            setProcessing(true)
            setError('')

            const createdSubscription =
                await subscriptionsAPI.creer(
                    plan.type
                )

            setSubscription(
                createdSubscription
            )

        } catch (e) {

            const message =
                getErrorMessage(e)

            /*
             * L'utilisateur avait déjà commencé
             * une souscription auparavant.
             *
             * On récupère simplement cette
             * souscription au lieu de bloquer.
             */
            if (
                message.includes(
                    'souscription est déjà en attente de paiement'
                )
            ) {

                try {

                    const subscriptionCourante =
                        await subscriptionsAPI.getCurrent()

                    setSubscription(
                        subscriptionCourante
                    )

                    setError('')

                    return

                } catch {

                    setError(message)

                    return
                }
            }

            setError(message)

        } finally {

            setProcessing(false)
        }
    }

    /*
     * ================================
     * PAIEMENT ORANGE MONEY
     * ================================
     */
    const effectuerPaiement = async () => {

        if (!subscription) {
            setError(
                'Aucune souscription en attente de paiement'
            )
            return
        }

        if (!paymentMethod) {
            setError(
                'Veuillez sélectionner un moyen de paiement'
            )
            return
        }

        if (!phoneNumber.trim()) {
            setError(
                'Le numéro Orange Money est obligatoire'
            )
            return
        }

        if (!otp.trim()) {
            setError(
                'Le code OTP est obligatoire'
            )
            return
        }

        try {
            setProcessing(true)
            setError('')

            const result =
                await paymentsAPI.initialize({
                    provider: paymentMethod,
                    phoneNumber: phoneNumber.trim(),
                    otp: otp.trim(),
                })

            setPayment(result)
            setOtp('')
            if (result.status === 'SUCCESS') {
                await onSubscriptionActivated()
            }

        } catch (e) {
            setError(
                getErrorMessage(e)
            )
        } finally {
            setProcessing(false)
        }
    }

    /*
     * ================================
     * VÉRIFICATION DU STATUT
     * ================================
     */
    const verifierStatut = async () => {

        if (!payment?.paymentReference) {

            setError('La référence du paiement est absente')

            return
        }

        try {

            setCheckingStatus(true)
            setError('')

            const result = await paymentsAPI.checkStatus(payment.paymentReference)

            setPayment(result)

            if (result.status === 'SUCCESS') {
                await onSubscriptionActivated()
            }

        } catch (e) {

            setError(
                getErrorMessage(e)
            )

        } finally {

            setCheckingStatus(false)
        }
    }

    /*
     * ================================
     * CHARGEMENT
     * ================================
     */
    if (loadingPlans) {

        return (
            <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">

                <div className="text-center">

                    <div className="text-orange-400 text-xl font-black">
                        CAPNEX PRO
                    </div>

                    <p className="text-gray-500 text-sm mt-2">
                        Chargement de votre abonnement...
                    </p>

                </div>

            </div>
        )
    }

    /*
     * ================================
     * UTILISATEUR VIP ACTIF
     * ================================
     */
    if (
        currentSubscription
        && currentSubscription.status === 'ACTIVE'
        && currentSubscription.valid
    ) {

        const daysRemaining =
            calculateDaysRemaining(
                currentSubscription.endDate
            )

        return (

            <div className="min-h-screen bg-gray-950 text-white">

                {/* HEADER DE LA PAGE */}

                <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">

                    <div className="max-w-2xl mx-auto">

                        <button
                            type="button"
                            onClick={onBack}
                            className="text-gray-400 hover:text-white text-sm mb-3 transition-colors"
                        >
                            ← Retour
                        </button>

                        <h1 className="text-xl font-black text-orange-400">
                            Mon abonnement
                        </h1>

                        <p className="text-gray-500 text-xs mt-1">
                            Gérez votre accès CAPNEX PRO
                        </p>

                    </div>

                </div>

                {/* CONTENU */}

                <div className="max-w-md mx-auto px-4 py-8">

                    <section className="bg-gray-900 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-xl">

                        {/* PARTIE PREMIUM */}

                        <div className="bg-gradient-to-b from-emerald-500/15 to-gray-900 px-6 py-8 text-center">

                            <div className="text-6xl mb-4">
                                👑
                            </div>

                            <p className="text-gray-500 text-xs uppercase tracking-[0.25em] font-bold">
                                CAPNEX PRO
                            </p>

                            <h2 className="text-2xl font-black text-white mt-2">
                                {getPlanLabel(
                                    currentSubscription.type
                                )}
                            </h2>

                            <span className="inline-flex items-center gap-2 mt-4 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-black px-4 py-1.5 rounded-full">

                                <span className="w-2 h-2 bg-emerald-400 rounded-full" />

                                ACTIF

                            </span>

                        </div>

                        {/* INFORMATIONS */}

                        <div className="p-6">

                            <div className="space-y-4">

                                <SubscriptionInfoLine
                                    label="Plan"
                                    value={
                                        getPlanLabel(
                                            currentSubscription.type
                                        )
                                    }
                                />

                                <SubscriptionInfoLine
                                    label="Début"
                                    value={
                                        formatDate(
                                            currentSubscription.startDate
                                        )
                                    }
                                />

                                <SubscriptionInfoLine
                                    label="Expiration"
                                    value={
                                        formatDate(
                                            currentSubscription.endDate
                                        )
                                    }
                                />

                                <SubscriptionInfoLine
                                    label="Jours restants"
                                    value={`${daysRemaining} jour${daysRemaining > 1
                                        ? 's'
                                        : ''
                                        }`}
                                />

                            </div>

                            {/* PROGRESSION */}

                            <div className="mt-6 pt-5 border-t border-gray-800">

                                <div className="flex justify-between text-xs mb-2">

                                    <span className="text-gray-500">
                                        Validité
                                    </span>

                                    <span className="text-emerald-400 font-bold">
                                        {daysRemaining} jours restants
                                    </span>

                                </div>

                                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">

                                    <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{
                                            width: `${calculateSubscriptionProgress(
                                                currentSubscription.startDate,
                                                currentSubscription.endDate
                                            )}%`,
                                        }}
                                    />

                                </div>

                            </div>

                            {/* AVANTAGES */}

                            <div className="mt-6 pt-5 border-t border-gray-800">

                                <h3 className="text-white font-bold text-sm mb-4">
                                    Vos avantages CAPNEX PRO
                                </h3>

                                <div className="space-y-3 text-sm">

                                    <BenefitLine text="Portefeuille professionnel" />

                                    <BenefitLine text="Outils avancés de décision" />

                                    <BenefitLine text="Alertes CAPNEX" />

                                    <BenefitLine text="Fonctionnalités VIP" />

                                </div>

                            </div>

                            <p className="text-gray-600 text-xs text-center mt-7">
                                Votre accès restera actif jusqu'au{' '}
                                {formatDate(
                                    currentSubscription.endDate
                                )}.
                            </p>

                        </div>

                    </section>
                    <section className="mt-6">

                        <div className="flex items-center justify-between mb-4">

                            <div>
                                <h2 className="text-white font-black text-lg">
                                    Historique des paiements
                                </h2>

                                <p className="text-gray-500 text-xs mt-1">
                                    Vos dernières transactions CAPNEX PRO
                                </p>
                            </div>

                            <span className="text-gray-600 text-xs">
                                {paymentHistory.length}
                            </span>

                        </div>

                        {loadingHistory && (

                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">

                                <p className="text-gray-500 text-sm">
                                    Chargement des paiements...
                                </p>

                            </div>

                        )}
                        {!loadingHistory && historyError && (
                            <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4">
                                <p className="text-red-400 text-sm">
                                    {historyError}
                                </p>
                            </div>
                        )}

                        {!loadingHistory &&
                            !historyError &&
                            paymentHistory.length === 0 && (

                                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">

                                    <div className="text-3xl mb-2">
                                        💳
                                    </div>

                                    <p className="text-gray-500 text-sm">
                                        Aucun paiement enregistré.
                                    </p>

                                </div>

                            )}

                        {!loadingHistory &&
                            paymentHistory.length > 0 && (

                                <div className="space-y-3">

                                    {paymentHistory.map(item => (

                                        <PaymentHistoryItem
                                            key={item.id}
                                            payment={item}
                                        />

                                    ))}

                                </div>

                            )}

                    </section>

                </div>

            </div>
        )
    }


    /*
     * ================================
     * FREE / PENDING / PAIEMENT
     * ================================
     */
    return (

        <div className="min-h-screen bg-gray-950 text-white">

            {/* HEADER */}

            <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">

                <div className="max-w-3xl mx-auto">

                    <button
                        type="button"
                        onClick={onBack}
                        className="text-gray-400 hover:text-white text-sm mb-3"
                    >
                        ← Retour
                    </button>

                    <h1 className="text-xl font-black text-orange-400">
                        CAPNEX PRO VIP
                    </h1>

                    <p className="text-gray-500 text-xs mt-1">
                        Débloquez les fonctionnalités professionnelles
                        de CAPNEX.
                    </p>

                </div>

            </div>

            <div className="max-w-3xl mx-auto px-4 py-6">

                {/* ERREUR */}

                {error && (

                    <div className="mb-5 bg-red-500/10 border border-red-500/40 text-red-400 rounded-xl p-4 text-sm">
                        {error}
                    </div>

                )}

                {/* ===========================
            OFFRES
            =========================== */}

                {!subscription && (

                    <section>

                        <div className="text-center mb-7">

                            <div className="text-4xl mb-3">
                                👑
                            </div>

                            <h2 className="text-white font-black text-2xl">
                                Passez à CAPNEX PRO
                            </h2>

                            <p className="text-gray-500 text-sm mt-2">
                                Choisissez l'offre adaptée à votre utilisation.
                            </p>

                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">

                            {plans.map(plan => (

                                <article
                                    key={plan.type}
                                    className={`relative bg-gray-900 rounded-2xl p-5 ${plan.type === 'VIP_YEARLY'
                                        ? 'border border-orange-500/50'
                                        : 'border border-gray-800'
                                        }`}
                                >

                                    {plan.type === 'VIP_YEARLY' && (

                                        <span className="absolute -top-3 right-4 bg-orange-500 text-black text-[10px] font-black px-3 py-1 rounded-full">
                                            RECOMMANDÉ
                                        </span>

                                    )}

                                    <div>

                                        <h3 className="text-white font-black text-lg">
                                            {getPlanLabel(plan.type)}
                                        </h3>

                                        <p className="text-gray-500 text-sm mt-1">
                                            {plan.durationInMonths}{' '}
                                            {plan.durationInMonths > 1
                                                ? 'mois'
                                                : 'mois'}
                                        </p>

                                    </div>

                                    <div className="mt-5">

                                        <span className="text-3xl font-black text-orange-400">
                                            {formatAmount(
                                                plan.price
                                            )}
                                        </span>

                                        <span className="text-gray-500 text-sm ml-1">
                                            XOF
                                        </span>

                                    </div>

                                    <ul className="mt-5 space-y-3 text-sm text-gray-300">

                                        <li>
                                            ✓ Portefeuille professionnel
                                        </li>

                                        <li>
                                            ✓ Analyses avancées
                                        </li>

                                        <li>
                                            ✓ Alertes CAPNEX
                                        </li>

                                        <li>
                                            ✓ Outils de décision
                                        </li>

                                    </ul>

                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={() =>
                                            void choisirPlan(plan)
                                        }
                                        className="mt-6 w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-black py-3 rounded-xl transition-colors"
                                    >

                                        {processing
                                            ? 'Traitement...'
                                            : 'Choisir cette offre'}

                                    </button>

                                </article>

                            ))}

                        </div>

                    </section>

                )}

                {subscription && !payment && !paymentMethod && (
                    <section className="max-w-md mx-auto">

                        <h2 className="text-white font-black text-xl text-center">
                            Choisissez votre moyen de paiement
                        </h2>

                        <div className="space-y-3 mt-6">

                            <button
                                type="button"
                                onClick={() =>
                                    setPaymentMethod('ORANGE_MONEY')
                                }
                                className="w-full bg-gray-900 border border-orange-500/40 rounded-2xl p-4 flex items-center justify-between hover:border-orange-500"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">
                                        📱
                                    </span>

                                    <div className="text-left">
                                        <p className="text-white font-bold">
                                            Orange Money
                                        </p>

                                        <p className="text-gray-500 text-xs">
                                            Paiement mobile
                                        </p>
                                    </div>
                                </div>

                                <span className="text-emerald-400 text-xs font-bold">
                                    Disponible
                                </span>
                            </button>

                            <button
                                type="button"
                                disabled
                                className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between opacity-50 cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">
                                        💳
                                    </span>

                                    <div className="text-left">
                                        <p className="text-white font-bold">
                                            Carte bancaire
                                        </p>

                                        <p className="text-gray-500 text-xs">
                                            Visa / Mastercard
                                        </p>
                                    </div>
                                </div>

                                <span className="text-gray-500 text-xs font-bold">
                                    Bientôt
                                </span>
                            </button>

                        </div>

                    </section>
                )}

                {/* ===========================
            PAIEMENT ORANGE MONEY
            =========================== */}

                {subscription &&
                    !payment &&
                    paymentMethod === 'ORANGE_MONEY' && (

                        <section className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

                            <button
                                type="button"
                                onClick={() => setPaymentMethod(null)}
                                className="text-sm text-gray-400 hover:text-white mb-4"
                            >
                                ← Changer de moyen de paiement
                            </button>
                            <div className="bg-orange-500/10 px-5 py-6 text-center">

                                <div className="text-4xl">
                                    📱
                                </div>

                                <h2 className="text-white font-black text-xl mt-3">
                                    Paiement Orange Money
                                </h2>

                                <p className="text-orange-400 font-bold text-sm mt-1">
                                    {getPlanLabel(
                                        subscription.type
                                    )}
                                </p>

                            </div>

                            <div className="p-5">

                                <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 mb-5">

                                    <p className="text-white text-sm font-bold">
                                        1. Générez votre OTP
                                    </p>

                                    <p className="text-gray-400 text-xs mt-2">
                                        Composez :
                                    </p>

                                    <div className="bg-gray-950 rounded-lg px-3 py-2 text-center mt-2">

                                        <span className="text-orange-400 font-mono font-black">
                                            *144*4*6*Montant#
                                        </span>

                                    </div>

                                    <p className="text-gray-500 text-xs mt-3">
                                        2. Revenez ensuite saisir votre numéro
                                        Orange Money et le code OTP obtenu.
                                    </p>

                                </div>

                                <div className="space-y-4">

                                    <div>

                                        <label
                                            htmlFor="phoneNumber"
                                            className="text-gray-400 text-sm block mb-1"
                                        >
                                            Numéro Orange Money
                                        </label>

                                        <input
                                            id="phoneNumber"
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={e =>
                                                setPhoneNumber(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="77710130"
                                            maxLength={13}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        />

                                    </div>

                                    <div>

                                        <label
                                            htmlFor="otp"
                                            className="text-gray-400 text-sm block mb-1"
                                        >
                                            Code OTP
                                        </label>

                                        <input
                                            id="otp"
                                            type="password"
                                            value={otp}
                                            onChange={e =>
                                                setOtp(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Saisissez votre OTP"
                                            autoComplete="one-time-code"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        />

                                    </div>

                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={() =>
                                            void effectuerPaiement()
                                        }
                                        className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-black py-3 rounded-xl transition-colors"
                                    >

                                        {processing
                                            ? 'Paiement en cours...'
                                            : 'Payer avec Orange Money'}

                                    </button>

                                </div>

                            </div>

                        </section>

                    )}

                {/* ===========================
            RÉSULTAT DU PAIEMENT
            =========================== */}

                {payment && (

                    <section className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">

                        <div className="text-6xl mb-4">

                            {getPaymentIcon(
                                payment.status
                            )}

                        </div>

                        <h2 className="text-white font-black text-2xl">

                            {getPaymentTitle(
                                payment.status
                            )}

                        </h2>

                        {payment.status === 'SUCCESS' && (

                            <p className="text-emerald-400 text-sm mt-2 font-bold">
                                Bienvenue dans CAPNEX PRO
                            </p>

                        )}

                        <div className="mt-6 bg-gray-800 rounded-xl p-4 space-y-3 text-sm">

                            <InfoLine
                                label="Référence"
                                value={
                                    payment.paymentReference
                                }
                            />

                            <InfoLine
                                label="Montant"
                                value={`${formatAmount(
                                    payment.amount
                                )} ${payment.currency}`}
                            />

                            <InfoLine
                                label="Statut"
                                value={
                                    payment.status
                                }
                            />

                        </div>

                        {payment.providerMessage && (

                            <div className={`mt-4 rounded-xl p-3 text-sm ${payment.status === 'FAILED'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-gray-800 text-gray-400'
                                }`}>

                                {payment.providerMessage}

                            </div>

                        )}

                        {/* PENDING */}

                        {payment.status === 'PENDING' && (

                            <button
                                type="button"
                                disabled={checkingStatus}
                                onClick={() =>
                                    void verifierStatut()
                                }
                                className="mt-5 w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl"
                            >

                                {checkingStatus
                                    ? 'Vérification...'
                                    : 'Vérifier le paiement'}

                            </button>

                        )}

                        {/* SUCCESS */}

                        {payment.status === 'SUCCESS' && (

                            <button
                                type="button"
                                onClick={() =>
                                    void onSubscriptionActivated()
                                }
                                className="mt-5 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3 rounded-xl"
                            >

                                Accéder à CAPNEX PRO

                            </button>

                        )}

                        {/* FAILED */}

                        {(payment.status === 'FAILED'
                            || payment.status === 'CANCELLED') && (

                                <button
                                    type="button"
                                    onClick={() => {

                                        setPayment(null)

                                        setOtp('')

                                        setError('')
                                    }}
                                    className="mt-5 w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl"
                                >

                                    Réessayer

                                </button>

                            )}

                    </section>

                )}

            </div>

        </div>
    )
}

/*
 * ======================================
 * COMPOSANTS UTILITAIRES
 * ======================================
 */

function InfoLine({
    label,
    value,
}: {
    label: string
    value: string
}) {

    return (

        <div className="flex justify-between gap-4">

            <span className="text-gray-500">
                {label}
            </span>

            <span className="text-white font-bold text-right break-all">
                {value}
            </span>

        </div>
    )
}

function SubscriptionInfoLine({
    label,
    value,
}: {
    label: string
    value: string
}) {

    return (

        <div className="flex items-center justify-between gap-4">

            <span className="text-gray-500 text-sm">
                {label}
            </span>

            <span className="text-white text-sm font-bold text-right">
                {value}
            </span>

        </div>
    )
}

function BenefitLine({
    text,
}: {
    text: string
}) {

    return (

        <div className="flex items-center gap-3">

            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-xs">
                ✓
            </span>

            <span className="text-gray-300">
                {text}
            </span>

        </div>
    )
}


/*
 * ======================================
 * LABEL PLAN
 * ======================================
 */

function getPlanLabel(
    type: string
): string {

    if (type === 'VIP_MONTHLY') {
        return 'VIP Mensuel'
    }

    if (type === 'VIP_YEARLY') {
        return 'VIP Annuel'
    }

    if (type === 'FREE') {
        return 'CAPNEX Free'
    }

    return type
}
function formatPaymentProvider(
    provider: string
): string {

    if (provider === 'ORANGE_MONEY') {
        return 'Orange Money'
    }

    if (provider === 'VISA') {
        return 'Carte Visa'
    }

    return provider
}
function formatPaymentStatus(
    status: string
): string {

    if (status === 'SUCCESS') {
        return 'PAYÉ'
    }

    if (status === 'FAILED') {
        return 'ÉCHOUÉ'
    }

    if (status === 'PENDING') {
        return 'EN ATTENTE'
    }

    if (status === 'CANCELLED') {
        return 'ANNULÉ'
    }

    return status
}
function formatDateTime(
    date: string
): string {

    return new Intl.DateTimeFormat(
        'fr-FR',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }
    ).format(
        new Date(date)
    )
}

function PaymentHistoryItem({
    payment,
}: {
    payment: PaymentResponse
}) {

    const success =
        payment.status === 'SUCCESS'

    const pending =
        payment.status === 'PENDING'

    return (

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">

            <div className="flex items-start justify-between gap-4">

                <div className="flex items-start gap-3">

                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${success
                            ? 'bg-emerald-500/15'
                            : pending
                                ? 'bg-amber-500/15'
                                : 'bg-red-500/15'
                            }`}
                    >

                        <span className="text-lg">

                            {success
                                ? '✓'
                                : pending
                                    ? '⏳'
                                    : '×'}

                        </span>

                    </div>

                    <div>

                        <p className="text-white font-bold text-sm">
                            {formatPaymentProvider(
                                payment.provider
                            )}
                        </p>

                        <p className="text-gray-500 text-xs mt-1">
                            {formatDateTime(
                                payment.createdAt
                            )}
                        </p>

                    </div>

                </div>

                <div className="text-right">

                    <p className="text-white font-black">
                        {formatAmount(
                            payment.amount
                        )}{' '}
                        <span className="text-gray-500 text-xs">
                            {payment.currency}
                        </span>
                    </p>

                    <span
                        className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-lg mt-1 ${success
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : pending
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-red-500/15 text-red-400'
                            }`}
                    >

                        {formatPaymentStatus(
                            payment.status
                        )}

                    </span>

                </div>

            </div>

            <div className="mt-3 pt-3 border-t border-gray-800">

                <p className="text-gray-600 text-[11px] font-mono break-all">
                    {payment.paymentReference}
                </p>

            </div>

        </div>
    )
}

/*
 * ======================================
 * PAIEMENT
 * ======================================
 */

function getPaymentIcon(
    status: string
): string {

    if (status === 'SUCCESS') {
        return '✅'
    }

    if (status === 'FAILED') {
        return '❌'
    }

    if (status === 'CANCELLED') {
        return '🚫'
    }

    return '⏳'
}

function getPaymentTitle(
    status: string
): string {

    if (status === 'SUCCESS') {
        return 'Paiement confirmé'
    }

    if (status === 'FAILED') {
        return 'Paiement échoué'
    }

    if (status === 'CANCELLED') {
        return 'Paiement annulé'
    }

    return 'Paiement en attente'
}

/*
 * ======================================
 * FORMAT DU MONTANT
 * ======================================
 */

function formatAmount(
    amount: number
): string {

    return new Intl.NumberFormat(
        'fr-FR'
    ).format(amount)
}

/*
 * ======================================
 * FORMAT DE DATE
 * ======================================
 */

function formatDate(
    date: string | null
): string {

    if (!date) {
        return 'Non définie'
    }

    return new Intl.DateTimeFormat(
        'fr-FR',
        {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        }
    ).format(
        new Date(
            `${date}T00:00:00`
        )
    )
}

/*
 * ======================================
 * JOURS RESTANTS
 * ======================================
 */

function calculateDaysRemaining(
    endDate: string | null
): number {

    if (!endDate) {
        return 0
    }

    const today =
        new Date()

    const expiration =
        new Date(
            `${endDate}T23:59:59`
        )

    const difference =
        expiration.getTime()
        - today.getTime()

    return Math.max(
        0,
        Math.ceil(
            difference
            / (1000 * 60 * 60 * 24)
        )
    )
}

/*
 * ======================================
 * PROGRESSION DE L'ABONNEMENT
 * ======================================
 */

function calculateSubscriptionProgress(
    startDate: string | null,
    endDate: string | null
): number {

    if (!startDate || !endDate) {
        return 0
    }

    const start =
        new Date(
            `${startDate}T00:00:00`
        )

    const end =
        new Date(
            `${endDate}T23:59:59`
        )

    const today =
        new Date()

    const totalDuration =
        end.getTime()
        - start.getTime()

    if (totalDuration <= 0) {
        return 0
    }

    const elapsed =
        today.getTime()
        - start.getTime()

    const progress =
        (elapsed / totalDuration) * 100

    return Math.min(
        100,
        Math.max(
            0,
            progress
        )
    )
}

/*
 * ======================================
 * MESSAGE D'ERREUR
 * ======================================
 */

function getErrorMessage(
    error: unknown
): string {

    if (error instanceof Error) {
        return error.message
    }

    return 'Une erreur est survenue'
}
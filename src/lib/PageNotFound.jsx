import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, ArrowLeft } from 'lucide-react';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-teal-400/8 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center text-center max-w-sm gap-6"
      >
        {/* Logo */}
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/25">
          <Leaf className="h-8 w-8 text-white" />
        </div>

        {/* Big 404 */}
        <div className="space-y-1">
          <p className="font-heading font-black text-[7rem] leading-none text-primary/15 select-none">404</p>
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary to-teal-500 mx-auto" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="font-heading font-bold text-2xl text-foreground">Página não encontrada</h1>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            Esta página não existe ou foi movida.<br />Volta ao início e continua a fazer a diferença! 🌿
          </p>
        </div>

        {/* Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-body font-medium text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>
      </motion.div>
    </div>
  );
}
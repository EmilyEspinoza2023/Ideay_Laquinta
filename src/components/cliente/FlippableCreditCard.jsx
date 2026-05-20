import * as React from "react"; 
import { cn } from "../../lib/utils"; 
  
const FlippableCreditCard = React.forwardRef( 
  ({ className, cardholderName, cardNumber, expiryDate, cvv, isFlipped, ...props }, ref) => { 
    return ( 
      <div 
        className={cn("group h-40 w-64 perspective-1000 mx-auto mb-6 cursor-pointer", className)} 
        ref={ref} 
        {...props} 
      > 
        <div className={cn(
          "relative h-full w-full rounded-xl shadow-xl card-flip-transition preserve-3d",
          isFlipped ? "rotate-y-180" : "group-hover:rotate-y-180"
        )}> 
           
          {/* --- CARD FRONT --- */} 
          <div className="absolute h-full w-full rounded-xl backface-hidden overflow-hidden shadow-2xl"> 
            {/* Banpro Premia Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#008f39] via-[#007a33] to-[#005c2a]" />
            
            {/* Subtle Pattern (Promerica dots/lines) */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            <div className="relative flex h-full flex-col justify-between p-4 text-white"> 
              {/* Card Header: Banpro Logo & Premia */} 
              <div className="flex items-start justify-between"> 
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tighter leading-none">banpro</span>
                  <span className="text-[7px] uppercase tracking-[0.2em] font-light">Grupo Promerica</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold italic leading-none tracking-tight">PREMIA</span>
                  <div className="h-[2px] w-8 bg-yellow-400 mt-1" />
                </div>
              </div> 
               
              {/* Chip and Contactless */}
              <div className="flex items-center gap-3 mt-1">
                <div className="w-9 h-7 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 border-[0.5px] border-black" />
                  <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-black opacity-20" />
                  <div className="absolute top-0 left-1/2 w-[0.5px] h-full bg-black opacity-20" />
                </div>
                <svg className="h-4 w-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 8c2.5 0 4.5 2 4.5 4.5S7.5 17 5 17" />
                  <path d="M8 5c4 0 7 3 7 7s-3 7-7 7" />
                  <path d="M11 2c5.5 0 10 4.5 10 10s-4.5 10-10 10" />
                </svg>
              </div>

              {/* Card Number */} 
              <div className="text-lg font-mono tracking-[0.1em] drop-shadow-md mt-1 whitespace-nowrap"> 
                {cardNumber || "•••• •••• •••• ••••"} 
              </div> 
  
              {/* Card Footer */} 
              <div className="flex items-end justify-between mt-auto pb-1"> 
                <div className="text-left"> 
                  <p className="text-[7px] font-light uppercase tracking-wider opacity-80 leading-none">Titular de la tarjeta</p> 
                  <p className="font-mono text-[10px] font-bold uppercase truncate max-w-[120px] drop-shadow-sm mt-1">
                    {cardholderName || "NOMBRE DEL TITULAR"}
                  </p> 
                </div> 
                <div className="flex items-end gap-3">
                  <div className="text-center"> 
                    <p className="text-[7px] font-light uppercase opacity-80 leading-none">Vence</p> 
                    <p className="font-mono text-[10px] font-bold mt-1">{expiryDate || "MM/AA"}</p> 
                  </div> 
                  <div className="h-7 w-10 flex items-center justify-center">
                    {/* Mastercard Logo Mini */}
                    <div className="relative flex">
                      <div className="w-5 h-5 rounded-full bg-[#eb001b] opacity-90" />
                      <div className="w-5 h-5 rounded-full bg-[#f79e1b] opacity-90 -ml-2.5" />
                    </div>
                  </div>
                </div>
              </div> 
            </div> 
          </div> 
           
          {/* --- CARD BACK --- */} 
          <div className="absolute h-full w-full rounded-xl bg-[#f3f4f6] text-neutral-900 backface-hidden rotate-y-180 overflow-hidden border border-neutral-300"> 
            <div className="flex h-full flex-col"> 
              {/* Magnetic Strip */} 
              <div className="mt-6 h-10 w-full bg-neutral-900" /> 
              
              {/* Signature and CVV Section */} 
              <div className="mx-4 mt-4"> 
                <p className="text-[6px] text-neutral-500 mb-1 uppercase tracking-tighter">Firma autorizada • No válida sin firma</p>
                <div className="flex h-8 w-full items-center"> 
                  <div className="flex-grow h-full bg-white border border-neutral-300 shadow-inner flex items-center px-2">
                    <span className="font-serif italic text-neutral-400 text-xs opacity-50 select-none">Signature</span>
                  </div>
                  <div className="w-12 h-full bg-white border-y border-r border-neutral-300 flex items-center justify-center">
                    <p className="font-mono text-sm text-black italic font-bold tracking-tighter">{cvv || "•••"}</p> 
                  </div>
                </div> 
              </div> 
              <p className="self-end pr-4 text-[8px] font-bold uppercase text-[#007a33] mt-1 italic">PREMIA CVV2</p> 
  
              {/* Info Text */}
              <div className="px-4 mt-1">
                <p className="text-[5px] text-neutral-500 leading-tight">
                  Esta tarjeta es propiedad de Banco de la Producción, S.A. (Banpro). Su uso está sujeto a los términos del contrato. Si la encuentra, por favor devuélvala a cualquier sucursal de Banpro o llame al (505) 2255-9595.
                </p>
              </div>

              {/* Signature Logo */} 
              <div className="mt-auto p-4 flex justify-between items-end"> 
                <div className="flex flex-col items-start">
                  <span className="text-[8px] font-black tracking-tighter leading-none text-[#007a33]">banpro</span>
                  <span className="text-[4px] uppercase tracking-[0.1em] font-light text-neutral-500">Grupo Promerica</span>
                </div>
                <div className="relative flex scale-75 origin-bottom-right">
                  <div className="w-6 h-6 rounded-full bg-[#eb001b] opacity-80" />
                  <div className="w-6 h-6 rounded-full bg-[#f79e1b] opacity-80 -ml-3" />
                </div>
              </div> 
            </div> 
          </div> 
        </div> 
      </div> 
    ); 
  } 
); 
FlippableCreditCard.displayName = "FlippableCreditCard"; 
  
export { FlippableCreditCard };

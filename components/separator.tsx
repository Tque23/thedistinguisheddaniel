// components/Separator.jsx
export default function Separator({ type = 1 }) {
  const isType1 = type === 1;

  return (
    <div className="w-full bg-white p-3">
      {/* Top Line */}
      <div 
        style={{ height: isType1 ? '3px' : '1px' }} 
        className="w-full bg-[#FFFFFF]" 
      />
      
      {/* Gap between the lines */}
      <div className="h-2 w-full" />

      {/* Bottom Line */}
      <div 
        style={{ height: isType1 ? '1px' : '3px' }} 
        className="w-full bg-[#FFFFFF]" 
      />
    </div>
  );
}

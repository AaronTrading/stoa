export const normalizeAffiliateReference=value=>String(value||'').trim().replace(/^@+/,'').slice(0,40);
export const chartPoints=(values,width=720,height=190)=>{
  const max=Math.max(1,...values.map(Number));
  return values.map((value,index)=>`${index*(width/Math.max(1,values.length-1))},${height-(Number(value)/max)*height}`).join(' ');
};


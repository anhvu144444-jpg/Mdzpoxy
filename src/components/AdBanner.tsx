import React, { useEffect, useRef } from 'react';

export const AdBanner = ({ dataKey, width, height }: { dataKey: string, width: number, height: number }) => {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bannerRef.current && !bannerRef.current.hasChildNodes()) {
      const conf = document.createElement('script');
      const script = document.createElement('script');
      
      conf.type = 'text/javascript';
      conf.innerHTML = `atOptions = {
        'key' : '${dataKey}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };`;
      
      script.type = 'text/javascript';
      script.src = `https://socialconventcontext.com/${dataKey}/invoke.js`;
      
      bannerRef.current.append(conf);
      bannerRef.current.append(script);
    }
  }, [dataKey, height, width]);

  return (
      <div className="flex justify-center items-center w-full my-4 overflow-hidden bg-slate-50 min-h-[50px] rounded-lg">
          <div ref={bannerRef} />
      </div>
  );
};

export const PopunderAd = () => {
    useEffect(() => {
        const pop = document.createElement('script');
        pop.src = "https://socialconventcontext.com/e4/f7/75/e4f7759d92f684ee31c3179f8525d4b2.js";
        pop.setAttribute('data-cfasync', 'false');
        document.body.appendChild(pop);
        return () => {
            if (document.body.contains(pop)) {
                document.body.removeChild(pop);
            }
        };
    }, []);
    return null;
};

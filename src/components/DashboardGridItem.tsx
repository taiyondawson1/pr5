
import { cn } from "@/lib/utils";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useNavigate } from "react-router-dom";

interface GridItemProps {
  area?: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  path?: string;
  onClick?: () => void;
}

const DashboardGridItem = ({ area, icon, title, description, path, onClick }: GridItemProps) => {
  const navigate = useNavigate();

  const handleNavigation = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <li className={cn("min-h-[14rem] list-none", area)}>
      <div 
        className="relative h-full rounded-xl border-[0.75px] border-silver/20 p-2 md:p-3 cursor-pointer"
        onClick={handleNavigation}
      >
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] border-silver/20 bg-darkBlue/40 p-4 md:p-6 shadow-sm shadow-[0px_0px_27px_0px_rgba(0,0,0,0.3)] backdrop-blur-sm">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border-[0.75px] border-silver/20 bg-darkGrey p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-softWhite">
                {title}
              </h3>
              <p className="font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-mediumGray">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default DashboardGridItem;


import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type StaffKeyInfo = {
  isValid: boolean;
  role: string | null;
  status: string | null;
  canBeUsedForEnrollment: boolean;
  staffKeyFormat: 'CEO' | 'ADMIN' | 'ENROLLER' | 'INVALID';
};

export const useStaffKeyValidation = (staffKey: string) => {
  const [staffKeyInfo, setStaffKeyInfo] = useState<StaffKeyInfo>({
    isValid: false,
    role: null,
    status: null,
    canBeUsedForEnrollment: false,
    staffKeyFormat: 'INVALID',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial staff key info
  useEffect(() => {
    const fetchStaffKeyInfo = async () => {
      if (!staffKey.trim()) {
        setStaffKeyInfo({
          isValid: false,
          role: null,
          status: null,
          canBeUsedForEnrollment: false,
          staffKeyFormat: 'INVALID',
        });
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if this is a valid staff key format first
        const isCEO = /^CEO\d{3}$/.test(staffKey);
        const isADMIN = /^AD\d{4}$/.test(staffKey);
        const isENROLLER = /^EN\d{4}$/.test(staffKey);
        
        let staffKeyFormat: 'CEO' | 'ADMIN' | 'ENROLLER' | 'INVALID' = 'INVALID';
        
        if (isCEO) staffKeyFormat = 'CEO';
        else if (isADMIN) staffKeyFormat = 'ADMIN';
        else if (isENROLLER) staffKeyFormat = 'ENROLLER';

        if (!isCEO && !isADMIN && !isENROLLER) {
          setStaffKeyInfo({
            isValid: false,
            role: null,
            status: null,
            canBeUsedForEnrollment: false,
            staffKeyFormat: 'INVALID',
          });
          setIsLoading(false);
          return;
        }

        // Fetch staff key info from database
        const { data, error } = await supabase
          .from('staff_keys')
          .select('key, role, status, user_id')
          .eq('key', staffKey)
          .single();

        if (error) {
          console.error("Error fetching staff key:", error);
          setStaffKeyInfo({
            isValid: false,
            role: null,
            status: null,
            canBeUsedForEnrollment: false,
            staffKeyFormat,
          });
          setIsLoading(false);
          return;
        }

        // Staff key exists and is active
        const isActive = data ? data.status === 'active' : false;
        
        // Check if this is a valid enrolling key (staff member)
        // CEO, ADMIN, and ENROLLER roles can enroll customers
        const canBeUsedForEnrollment = isActive && 
          (data.role === 'ceo' || data.role === 'admin' || data.role === 'enroller');

        setStaffKeyInfo({
          isValid: isActive,
          role: data ? data.role : null,
          status: data ? data.status : null,
          canBeUsedForEnrollment,
          staffKeyFormat,
        });
      } catch (e) {
        console.error("Error in staff key validation:", e);
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaffKeyInfo();
  }, [staffKey]);

  // Set up real-time subscription for staff keys
  useEffect(() => {
    if (!staffKey.trim()) return;

    const staffKeysChannel = supabase
      .channel('staff-keys-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_keys',
          filter: `key=eq.${staffKey}`,
        },
        async (payload) => {
          console.log('Staff key changed:', payload);
          // Refresh staff key info
          try {
            const { data } = await supabase
              .from('staff_keys')
              .select('key, role, status, user_id')
              .eq('key', staffKey)
              .single();

            if (data) {
              const isActive = data.status === 'active';
              const canBeUsedForEnrollment = isActive && 
                (data.role === 'ceo' || data.role === 'admin' || data.role === 'enroller');
              
              let staffKeyFormat: 'CEO' | 'ADMIN' | 'ENROLLER' | 'INVALID' = 'INVALID';
              if (/^CEO\d{3}$/.test(staffKey)) staffKeyFormat = 'CEO';
              else if (/^AD\d{4}$/.test(staffKey)) staffKeyFormat = 'ADMIN';
              else if (/^EN\d{4}$/.test(staffKey)) staffKeyFormat = 'ENROLLER';
              
              setStaffKeyInfo(prev => ({
                ...prev,
                isValid: isActive,
                role: data.role,
                status: data.status,
                canBeUsedForEnrollment,
                staffKeyFormat,
              }));
            }
          } catch (e) {
            console.error("Error refreshing staff key info:", e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(staffKeysChannel);
    };
  }, [staffKey]);

  return { staffKeyInfo, isLoading, error };
};

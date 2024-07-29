import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";

interface GptDataProps {
  gptData: any;
  isGptDataLoading: boolean;
}

const labelMapping: { [key: string]: string } = {
  name: "Name",
  phone_number: "Phone Number",
  address: "Address",
  email_address: "Email",
  company_name: "Company Name",
  company_website: "Company Website",
  job_title: "Job Title",
};

const GptData: React.FC<any> = ({ gptData, isGptDataLoading }) => {
  return (
    <div>
      {isGptDataLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-1/4" />
        </div>
      ) : (
        gptData &&
        Object.entries(gptData).map(([key, value]) => {
          if (key === "logo" || key === "logo_detected") {
            return null;
          }

          const displayKey = labelMapping[key] || key.replace(/_/g, " ");
          return (
            <div key={key} className="flex w-full items-start mt-3 mb-2">
              <div className="flex-grow">
                <Label className="block text-white mb-4">{displayKey}:</Label>
                <Input
                  defaultValue={
                    typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)
                  }
                  className="mt-1 block w-full bg-gray-700 text-black border border-gray-600 rounded-md shadow-sm focus:ring focus:ring-opacity-50 mb-2 p-2"
                />
              </div>
              <div className="ml-2">
                <AlertDialog>
                  <AlertDialogTrigger>
                    <Button
                      variant="none_bg"
                      className="w-6 h-6 flex items-center justify-center p-0 text-red-500">
                      <X />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete this data. Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default GptData;

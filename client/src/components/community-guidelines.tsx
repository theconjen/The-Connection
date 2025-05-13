import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HeartIcon, HandHelping, BookIcon, Egg } from "lucide-react";
import { Link } from "wouter";

export default function CommunityGuidelines() {
  const guidelines = [
    {
      icon: <HeartIcon className="text-red-500 mt-1 mr-2 h-4 w-4" />,
      text: "Speak the truth in love; be kind and respectful",
    },
    {
      icon: <HandHelping className="text-amber-500 mt-1 mr-2 h-4 w-4" />,
      text: "Support one another through prayer and encouragement",
    },
    {
      icon: <BookIcon className="text-green-500 mt-1 mr-2 h-4 w-4" />,
      text: "Base discussions on Scripture when possible",
    },
    {
      icon: <Egg className="text-blue-500 mt-1 mr-2 h-4 w-4" />,
      text: "Seek unity in essential beliefs, liberty in non-essentials",
    },
  ];

  return (
    <Card>
      <CardHeader className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <CardTitle className="font-semibold text-neutral-800">
          Community Guidelines
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 text-sm">
        <ul className="space-y-2">
          {guidelines.map((guideline, index) => (
            <li key={index} className="flex items-start">
              {guideline.icon}
              <span>{guideline.text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Link href="/guidelines" 
            className="text-primary text-sm font-medium hover:text-primary-700">
            Read Full Guidelines
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

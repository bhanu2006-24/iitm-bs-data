
import { ExternalLink, FileText, MessageCircle, BookOpen, Link as LinkIcon, Youtube, Calendar, MapPin, Globe } from 'lucide-react';

export const IMPORTANT_LINKS = [
    { 
        category: "Essentials",
        items: [
            { title: "Student Dashboard", url: "https://student.onlinedegree.iitm.ac.in", icon: ExternalLink },
            { title: "Academic Calendar", url: "https://onlinedegree.iitm.ac.in/academics.html", icon: Calendar },
            { title: "Exam Cities List", url: "https://onlinedegree.iitm.ac.in/exam_cities.html", icon: MapPin },
        ]
    },
    {
        category: "Community & Support",
        items: [
            { title: "Discourse Forum", url: "https://discourse.onlinedegree.iitm.ac.in", icon: MessageCircle },
            { title: "Seekho Mentorship", url: "https://seekho.iitm.ac.in", icon: BookOpen },
            { title: "Official Support", url: "mailto:support@onlinedegree.iitm.ac.in", icon: LinkIcon },
        ]
    },
    {
        category: "Learning Resources",
        items: [
            { title: "NPTEL Archive", url: "https://nptel.ac.in/", icon: Globe },
            { title: "Official YouTube", url: "https://www.youtube.com/@IITMadrasOnlineDegree", icon: Youtube },
        ]
    }
];

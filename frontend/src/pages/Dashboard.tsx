import React from 'react';
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, MenuIcon, Building2 } from "lucide-react";

const statCards = [
  {
    title: "Total Users",
    value: "245",
    icon: Users,
    change: "+12%",
    positive: true,
  },
  {
    title: "Active Roles",
    value: "8",
    icon: ShieldCheck,
    change: "+2",
    positive: true,
  },
  {
    title: "Menu Items",
    value: "32",
    icon: MenuIcon,
    change: "0",
    positive: true,
  },
  {
    title: "Office Locations",
    value: "5",
    icon: Building2,
    change: "+1",
    positive: true,
  },
];

const Dashboard = () => {
  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle="Welcome to Office Nexus System"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className={`text-xs ${card.positive ? 'text-green-600' : 'text-red-600'} mt-1 flex items-center`}>
                {card.change}
                {card.positive ? (
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {' '}since last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Users size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">User {i} logged in</p>
                    <p className="text-xs text-gray-500">{i} hour{i !== 1 ? 's' : ''} ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Latest Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="pb-4 border-b">
                <p className="font-medium text-sm">System Update</p>
                <p className="text-xs text-gray-500 mt-1">Version 1.0.4 released with bug fixes and performance improvements.</p>
                <p className="text-xs text-gray-500 mt-2">2 days ago</p>
              </div>
              <div className="pb-4 border-b">
                <p className="font-medium text-sm">New Department Added</p>
                <p className="text-xs text-gray-500 mt-1">Marketing department has been added to the system.</p>
                <p className="text-xs text-gray-500 mt-2">3 days ago</p>
              </div>
              <div>
                <p className="font-medium text-sm">Database Maintenance</p>
                <p className="text-xs text-gray-500 mt-1">Scheduled database maintenance completed successfully.</p>
                <p className="text-xs text-gray-500 mt-2">5 days ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

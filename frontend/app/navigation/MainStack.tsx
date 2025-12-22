import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Dashboard from "../dashboard/Dashboard";
import Statistics from "../dashboard/Statistics";
import Crawler from "../dashboard/Crawler";

const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
        animation: "none",
      }}
      initialRouteName="Dashboard"
    >
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="Statistics" component={Statistics} />
      <Stack.Screen name="Crawler" component={Crawler} />
    </Stack.Navigator>
  );
};

export default MainStack;

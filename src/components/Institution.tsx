import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { GetInsitution } from "@requests/institution";
import { Institution as InstitutionModel } from "@models/institution";
import {
  Card,
  Typography,
  Button,
} from "@mui/material";
import {
  ShoppingCart,
  Edit,
} from "@mui/icons-material";

const InstitutionProfileComponent = () => {
  const { t } = useTranslation();
  const [institution, setInstitution] = useState<InstitutionModel | null>(null);

  useEffect(() => {
    GetInsitution()
      .then((response) => response.data)
      .then((data) => setInstitution(data));
    // Additional API calls would go here
  }, []);

  const handleManageProducts = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/inventory";
    }
  };

  const handleEditInstitution = () => {
    console.log("Edit institution profile");
    // Add edit logic here
  };

  return (
    <div className="flex-1 p-6 w-full mx-auto">
      {/* Header Section with Action Buttons */}
      <Card className="mb-6 p-6 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Typography variant="h4" className="text-xl sm:text-2xl lg:text-3xl font-bold">
              {institution?.name}
            </Typography>
            <Typography variant="subtitle1" className="text-gray-600">
              ID: {institution?.id}
            </Typography>
          </div>
          {/* <div className="flex items-center space-x-4">
            <Chip
              label={`${stats.systemUptime}% Uptime`}
              color="success"
              variant="outlined"
              className="border-green-500"
            />
            <div className="bg-blue-600 text-white px-4 py-2 rounded">
              <Typography variant="h6" className="text-lg font-medium">
                {stats.membershipType} Member
              </Typography>
            </div>
          </div> */}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <Button 
            variant="contained" 
            startIcon={<Edit />}
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleEditInstitution}
          >
            {t('institution.editInstitution')}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<ShoppingCart />}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            onClick={handleManageProducts}
          >
            {t('institution.manageProducts')}
          </Button>
        </div>
      </Card>

      {/* Key Statistics */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <Paper className="p-6 shadow-md">
          <div className="flex flex-col items-center space-y-3">
            <People className="text-5xl text-blue-600" />
            <Typography variant="h4" className="text-2xl sm:text-3xl font-bold">
              {stats.totalStaff}
            </Typography>
            <Typography variant="subtitle1" className="text-gray-600">
              Total Staff
            </Typography>
          </div>
        </Paper>
        
        <Paper className="p-6 shadow-md">
          <div className="flex flex-col items-center space-y-3">
            <LocalHospital className="text-5xl text-blue-600" />
            <Typography variant="h4" className="text-2xl sm:text-3xl font-bold">
              {stats.totalPatients}
            </Typography>
            <Typography variant="subtitle1" className="text-gray-600">
              Registered Patients
            </Typography>
          </div>
        </Paper>
        
        <Paper className="p-6 shadow-md">
          <div className="flex flex-col items-center space-y-3">
            <CalendarMonth className="text-5xl text-blue-600" />
            <Typography variant="h4" className="text-2xl sm:text-3xl font-bold">
              {stats.monthlyVisits}
            </Typography>
            <Typography variant="subtitle1" className="text-gray-600">
              This Month's Visits
            </Typography>
          </div>
        </Paper>
        
        <Paper className="p-6 shadow-md">
          <div className="flex flex-col items-center space-y-3">
            <TrendingUp className="text-5xl text-blue-600" />
            <Typography variant="h4" className="text-2xl sm:text-3xl font-bold">
              {stats.patientSatisfaction}%
            </Typography>
            <Typography variant="subtitle1" className="text-gray-600">
              Patient Satisfaction
            </Typography>
          </div>
        </Paper>
      </div> */}

      {/* Product & Stock Management Section */}
      {/* <Card className="p-6 shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6" className="text-lg sm:text-xl font-semibold">
            Inventory Overview
          </Typography>
          <div className="flex gap-3">
            <Button 
              variant="contained" 
              size="small"
              startIcon={<ShoppingCart />}
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleManageProducts}
            >
              Products
            </Button>
            <Button 
              variant="contained" 
              size="small"
              startIcon={<Inventory />}
              className="bg-green-600 hover:bg-green-700"
              onClick={handleManageStock}
            >
              Stock
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Paper className="p-4 flex items-center gap-3 shadow-sm">
            <div className="bg-blue-100 p-3 rounded-full">
              <ShoppingCart className="text-blue-600" />
            </div>
            <div>
              <Typography variant="body1" className="font-medium">
                Total Products
              </Typography>
              <Typography variant="h6" className="text-lg sm:text-xl font-bold">
                1,245
              </Typography>
            </div>
          </Paper>
          
          <Paper className="p-4 flex items-center gap-3 shadow-sm">
            <div className="bg-green-100 p-3 rounded-full">
              <Inventory className="text-green-600" />
            </div>
            <div>
              <Typography variant="body1" className="font-medium">
                In Stock Items
              </Typography>
              <Typography variant="h6" className="text-lg sm:text-xl font-bold">
                8,392
              </Typography>
            </div>
          </Paper>
          
          <Paper className="p-4 flex items-center gap-3 shadow-sm">
            <div className="bg-yellow-100 p-3 rounded-full">
              <AttachMoney className="text-yellow-600" />
            </div>
            <div>
              <Typography variant="body1" className="font-medium">
                Inventory Value
              </Typography>
              <Typography variant="h6" className="text-lg sm:text-xl font-bold">
                $1.2M
              </Typography>
            </div>
          </Paper>
        </div>
      </Card> */}

      {/* Department Statistics & Certifications */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6 shadow-md">
          <Typography variant="h6" className="text-lg sm:text-xl font-semibold mb-4">
            Department Overview
          </Typography>
          <div className="space-y-6">
            {departments.map((dept) => (
              <div key={dept.name} className="mb-2">
                <div className="flex justify-between mb-2">
                  <Typography className="font-medium">{dept.name}</Typography>
                  <Typography>{dept.staffCount} staff</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <LinearProgress
                    variant="determinate"
                    value={dept.utilizationRate}
                    className="w-full h-2 rounded"
                  />
                  <Typography variant="body2" className="text-xs sm:text-sm">
                    {dept.utilizationRate}% utilization
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 shadow-md">
          <Typography variant="h6" className="text-lg sm:text-xl font-semibold mb-4">
            Certifications & Compliance
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-semibold">Certification</TableCell>
                  <TableCell className="font-semibold">Issuer</TableCell>
                  <TableCell className="font-semibold">Valid Until</TableCell>
                  <TableCell className="font-semibold">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {certifications.map((cert) => (
                  <TableRow key={cert.name} className="hover:bg-gray-50">
                    <TableCell>{cert.name}</TableCell>
                    <TableCell>{cert.issuer}</TableCell>
                    <TableCell>{cert.validUntil}</TableCell>
                    <TableCell>
                      <Chip
                        label={cert.status}
                        color={cert.status === "Active" ? "success" : "warning"}
                        size="small"
                        className={cert.status === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </div> */}

      {/* System Integration Status */}
      {/* <Card className="p-6 shadow-md mb-6">
        <Typography variant="h6" className="text-xl font-semibold mb-4">
          System Integration Status
        </Typography>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            "Electronic Health Records",
            "Laboratory Information System",
            "Pharmacy Management",
            "Billing System",
            "Appointment Scheduling",
            "Inventory Management",
          ].map((system) => (
            <Paper key={system} className="p-4 flex items-center gap-3 shadow-sm">
              <IntegrationInstructions className="text-blue-600" />
              <div>
                <Typography variant="body1" className="font-medium">
                  {system}
                </Typography>
                <Chip
                  label="Connected"
                  size="small"
                  color="success"
                  className="mt-1 bg-green-100 text-green-800"
                />
              </div>
            </Paper>
          ))}
        </div>
      </Card> */}

      {/* Subscription & Usage */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 shadow-md">
          <Typography variant="h6" className="text-lg sm:text-xl font-semibold mb-4">
            Subscription Details
          </Typography>
          <List>
            <ListItem className="px-0">
              <ListItemIcon>
                <AttachMoney className="text-blue-600" />
              </ListItemIcon>
              <ListItemText
                primary="Current Plan"
                secondary={`${stats.membershipType} - $1,999/month`}
                className="text-gray-700"
              />
            </ListItem>
            <ListItem className="px-0">
              <ListItemIcon>
                <CalendarMonth className="text-blue-600" />
              </ListItemIcon>
              <ListItemText
                primary="Next Billing Date"
                secondary="December 1, 2023"
                className="text-gray-700"
              />
            </ListItem>
            <ListItem className="px-0">
              <ListItemIcon>
                <Security className="text-blue-600" />
              </ListItemIcon>
              <ListItemText
                primary="Data Storage"
                secondary="500GB of 1TB used"
                className="text-gray-700"
              />
            </ListItem>
          </List>
        </Card>

        <Card className="p-6 shadow-md">
          <Typography variant="h6" className="text-lg sm:text-xl font-semibold mb-4">
            Usage Analytics
          </Typography>
          <div className="space-y-6">
            <div>
              <Typography variant="body2" className="text-gray-600 mb-1">
                API Calls (This Month)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={75}
                className="h-2 rounded-full mb-1"
              />
              <Typography variant="caption" className="text-xs text-gray-500">
                750,000 / 1,000,000 calls
              </Typography>
            </div>
            <div>
              <Typography variant="body2" className="text-gray-600 mb-1">
                Storage Usage
              </Typography>
              <LinearProgress
                variant="determinate"
                value={50}
                className="h-2 rounded-full mb-1"
              />
              <Typography variant="caption" className="text-xs text-gray-500">
                500GB / 1TB used
              </Typography>
            </div>
            <div>
              <Typography variant="body2" className="text-gray-600 mb-1">
                User Licenses
              </Typography>
              <LinearProgress
                variant="determinate"
                value={90}
                className="h-2 rounded-full mb-1"
              />
              <Typography variant="caption" className="text-xs text-gray-500">
                180 / 200 licenses used
              </Typography>
            </div>
          </div>
        </Card>
      </div> */}
    </div>
  );
};

export default InstitutionProfileComponent;

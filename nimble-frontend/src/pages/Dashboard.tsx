import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import StatCard from "../components/cards/StatCard";

export const Dashboard = () => {
  return (
    <Box>
      <Grid container spacing={2} mb={3}>
        <Grid>
          <StatCard
            title="Available Early Payment"
            value="$455,324"
            actionLabel="Advance Payment"
          />
        </Grid>
        <Grid>
          <StatCard
            title="Pending Approval"
            value="$675,487"
            actionLabel="Viewing and Approving Requests"
          />
        </Grid>
        <Grid>
          <StatCard
            title="In Approval"
            value="$567,311"
            actionLabel="Viewing"
          />
        </Grid>
        <Grid>
          <StatCard
            title="My Buyers"
            value="12"
            actionLabel="Buyers Management"
          />
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Invoice Trend</Typography>
          <ToggleButtonGroup size="small" exclusive>
            <ToggleButton value="3M">3M</ToggleButton>
            <ToggleButton value="6M">6M</ToggleButton>
            <ToggleButton value="1Y">1Y</ToggleButton>
            <ToggleButton value="2Y">2Y</ToggleButton>
            <ToggleButton value="ALL">ALL</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box
          mt={2}
          height={300}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {/* כאן ייכנס גרף קווי (Recharts / Chart.js) */}
          <Typography color="textSecondary">[Graph Placeholder]</Typography>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Invoices Status
            </Typography>
            {/* Pie Chart here */}
            <Typography color="textSecondary">
              [Pie Chart Placeholder]
            </Typography>
          </Paper>
        </Grid>
        <Grid>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Invoice Potential
            </Typography>
            {/* Table here */}
            <Typography color="textSecondary">[Table Placeholder]</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

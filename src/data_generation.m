% linear system
A = [...
        0    1.0000         0;...
        0         0   -1.0000;...
        1.6050    4.8680   -3.5754]; 
    
B = [0; 1; 0];

linSys  = linearSys(A, B);

% uncertain inputs
% system dynamics are defined wrt these bounds
% (i.e., don't expand the bounds!)
params.U = zonotope(interval(-9, 1));

% reachability analysis settings (affects final visualization fidelity)
options.timeStep = 0.02; 
options.zonotopeOrder = 200;
options.taylorTerms = 4;

% unsafe set(s)
% (assume reference distance is 10m)
% it's unsafe to be this far past the reference distance no matter what:
DISJUNCTIVE_DIST_LOWER_BOUND = -9;
% it's unsafe to be closing the distance to the next car this fast no matter what:
DISJUNCTIVE_SPEED_LOWER_BOUND = -8;
% it's unsafe to be this far past AND moving towards the lead this fast at the same time:
% (these should each be more strict than the disjunctive bounds)
CONJUCTIVE_DIST_LOWER_BOUND = -5;
CONJUNCTIVE_SPEED_LOWER_BOUND = -5;

finalTime = 10;

for initDist = -5:10
    for initAccel = -9:1
        % initial state: e1, e1-dot, a1
        % e1-dot is 0 to enforce the two vehicles moving at the same speed at t=0
        params.R0 = zonotope([initDist; 0; initAccel]);
        
        params.tFinal = finalTime;

        % reachability
        R = reach(linSys, params, options);

        veryLowestDist = 999999;
        veryLowestSpeed = 999999;
        veryHighestDist = -999999;
        veryHighestSpeed = -999999;

        lastTimeStep = finalTime / options.timeStep;
        for i = 1:length(R.timeInterval.set)
            projection = project(R.timeInterval.set{i}, [1 2]);
            projectionInterval = interval(projection);
            lowest = infimum(projectionInterval);
            highest = supremum(projectionInterval);
            lowestDist = lowest(1);
            lowestSpeed = lowest(2);
            veryLowestDist = min([lowestDist veryLowestDist]);
            veryLowestSpeed = min([lowestSpeed veryLowestSpeed]);
            veryHighestDist = max([highest(1) veryHighestDist]);
            veryHighestSpeed = max([highest(2) veryHighestSpeed]);
        end
        
        % plotting (provides x-y values for D3 on frontend)
        buffer = 5;
        xLower = veryLowestDist - buffer;
        yLower = veryLowestSpeed - buffer;
        xHigher = veryHighestDist + buffer;
        yHigher = veryHighestSpeed + buffer;
        % make plots invisible to prevent opening dozens of windows
        figure('Visible', 'off'); hold on
        xlim([xLower, xHigher]);
        ylim([yLower, yHigher]);
        
        % plot reachable sets
        plottingTimeStep = .5;
        plottingStepSize = plottingTimeStep / options.timeStep;
        xData = cell(size(plottingStepSize:plottingStepSize:lastTimeStep));
        yData = cell(size(plottingStepSize:plottingStepSize:lastTimeStep));
        timeData = cell(size(plottingStepSize:plottingStepSize:lastTimeStep));
        cellIndex = 1;
        for i = plottingStepSize:plottingStepSize:lastTimeStep
            RPlot = plot(R.timePoint.set{i}, [1 2]);
            xData{cellIndex} = RPlot.XData;
            yData{cellIndex} = RPlot.YData;
            lengthHere = size(RPlot.XData);
            lengthHere = lengthHere(2);
            timeData{cellIndex} = repelem(i * options.timeStep, lengthHere);
            cellIndex = cellIndex + 1;
        end
        hold off
        
        % save this iteration's data
        % don't forget to collate the CSVs with csv_collater.py
         directory = strcat('viz/data/d', num2str(initDist), '/a', num2str(initAccel));
         fileName = strcat(directory, '/data.csv');
         if ~exist(directory, 'dir')
             mkdir(directory);
         end
 
         timeData = [timeData{:}];
         xData = [xData{:}];
         yData = [yData{:}];
         data = [timeData' xData' yData'];
         table = array2table(data);
         table.Properties.VariableNames(1:3) = {'time', 'e1', 'e1dot'};
         
         writetable(table, fileName);
    end
end

clear
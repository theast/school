function [ sigma ] = xsum( x )

[mu, sig] = sge(x);

sigma = 0;
for i=1:size(x)
    sub = x(i,:)' - mu;
   sigma = sigma + transpose(sub)*sub; 
end

end

